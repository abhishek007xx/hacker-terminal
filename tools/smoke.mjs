/* ============================================================
   End-to-end smoke test.

       npm run smoke

   Serves ./dist with a tiny static server, drives system Chrome
   through Playwright, and asserts the things that actually break:
   boot -> reveal, terminal input, Mission Brief overlay, topbar
   control rhythm, mobile tabs, console/page errors.
   Screenshots land in tools/shots/.
   ============================================================ */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const shots = join(root, 'tools', 'shots');
const PORT = 4399;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.json': 'application/json; charset=utf-8',
};

const results = [];
const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  - ' + detail : ''}`);
};

const server = http.createServer(async (req, res) => {
    try {
        const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        let file = join(dist, normalize(p).replace(/^(\.\.[/\\])+/, ''));
        if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
        if (!(await stat(file).catch(() => null))) file = join(dist, '404.html');
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
        res.end(body);
    } catch {
        res.writeHead(500).end('err');
    }
});
await new Promise((r) => server.listen(PORT, r));
await mkdir(shots, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
const pageErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => pageErrors.push(String(e)));

const url = `http://localhost:${PORT}/`;

try {
    await page.goto(url, { waitUntil: 'load' });

    /* ---- 1. page shell / SEO ---- */
    check('title targets hacker typer', (await page.title()).includes('Hacker Typer'), await page.title());
    check('exactly one h1', (await page.locator('h1').count()) === 1);
    check('five panel h2 headings', (await page.locator('h2.panel-title').count()) === 5);
    check(
        'canonical + og:image present',
        (await page.locator('link[rel="canonical"]').count()) === 1 &&
            (await page.locator('meta[property="og:image"]').count()) === 1,
    );
    check('two json-ld blocks', (await page.locator('script[type="application/ld+json"]').count()) === 2);

    /* ---- 2. client globals bundled in the right order ---- */
    const globals = await page.evaluate(() =>
        ['NX', 'Monitor', 'Terminal', 'HackerTyper', 'Boot', 'NexusApp', 'NexusAudio'].map(
            (g) => `${g}:${typeof window[g]}`,
        ),
    );
    check('all client globals defined', globals.every((g) => g.endsWith(':object')), globals.join(' '));

    /* ---- 3. direct launch / no loading delay ---- */
    await page.waitForSelector('#app.revealed', { timeout: 5000 });
    check('app reveals directly on load', true);
    const bootCount = await page.locator('#boot-screen').count();
    check('loading screen is removed', bootCount === 0);
    await page.waitForTimeout(600);

    /* ---- 4. topbar control rhythm ---- */
    const heights = await page.evaluate(() =>
        ['btn-mute', 'btn-fullscreen', 'btn-theme', 'btn-brief', 'btn-cam']
            .map((id) => document.getElementById(id))
            .filter(Boolean)
            .map((el) => Math.round(el.getBoundingClientRect().height)),
    );
    check('topbar buttons share one height', new Set(heights).size === 1, JSON.stringify(heights));

    /* ---- 5. no horizontal overflow ---- */
    const of1440 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('no horizontal overflow @1440', of1440 <= 1, `${of1440}px`);

    /* ---- 6. typing starts hacker typer directly ---- */
    await page.waitForFunction(() => window.Terminal && !window.Terminal.busy, { timeout: 15000 });
    await page.evaluate(() => window.Terminal.focus());
    await page.keyboard.type('hack');
    await page.waitForTimeout(500);
    const termText = await page.locator('#terminal-output').innerText();
    const isHackerActive = await page.evaluate(() => window.HackerTyper && window.HackerTyper.active);
    check('tactical intro loaded', termText.includes('initializing black-ops tactical shell'));
    check('typing starts hacker typer directly', isHackerActive && termText.length > 200, `${termText.length} chars of output`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    /* ---- 7. Mission Brief overlay ---- */
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press('Shift+Slash'); // '?' on a US layout
    await page.waitForSelector('#brief-modal.active', { timeout: 5000 });
    check('brief opens with ?', true);
    await page.waitForTimeout(500); // let the 0.3s fade finish before shooting
    const briefText = (await page.locator('#brief-modal').innerText()).toLowerCase();
    check(
        'brief carries crawlable copy',
        briefText.includes('hacker typer') && briefText.includes('frequently asked questions'),
        `${briefText.length} chars`,
    );
    await page.screenshot({ path: join(shots, 'desktop-brief.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    check('brief closes with ESC', (await page.locator('#brief-modal.active').count()) === 0);

    /* ---- 8. theme cycling ---- */
    await page.click('#btn-theme');
    await page.waitForTimeout(300);
    const theme = await page.evaluate(() => document.body.className);
    check('theme cycles off green', /theme-(cyan|amber|red|purple)/.test(theme), theme);

    await page.screenshot({ path: join(shots, 'desktop.png') });

    /* ---- 9. mobile layout ---- */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    const of390 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('no horizontal overflow @390', of390 <= 1, `${of390}px`);

    const panes = {
        terminal: '.terminal-region',
        monitor: '.right-column',
        network: '.topo-panel',
        log: '.eventlog-panel',
    };
    const detail = [];
    let panesOk = true;
    for (const [tab, sel] of Object.entries(panes)) {
        await page.click(`.mtab[data-tab="${tab}"]`);
        await page.waitForTimeout(400);
        const n = await page.evaluate(
            (s) => [...document.querySelectorAll(s)].filter((e) => e.offsetParent !== null).length,
            sel,
        );
        detail.push(`${tab}:${n}`);
        if (n < 1) panesOk = false;
        if (tab === 'terminal' || tab === 'monitor') {
            await page.screenshot({ path: join(shots, `mobile-${tab}.png`) });
        }
    }
    check('all four mobile panes render', panesOk, detail.join(' '));
} catch (err) {
    check('run completed without throwing', false, String(err).split('\n')[0]);
} finally {
    check('no uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
    const real = consoleErrors.filter((e) => !/favicon|Autoplay|AudioContext|WebGL|GPU/i.test(e));
    check('no console errors', real.length === 0, real.slice(0, 3).join(' | '));
    await browser.close();
    server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);


