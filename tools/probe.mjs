/* ============================================================
   Layout probe — quick diagnostics for responsive/overflow issues.

       node tools/probe.mjs

Serves ./dist, opens Chrome at desktop + mobile viewports, and dumps
bounding boxes / overflow measurements for the elements that usually
misbehave. Not an assertion suite; just facts for tuning CSS.
============================================================ */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const PORT = 4398;

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

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const url = `http://localhost:${PORT}/`;
await page.goto(url, { waitUntil: 'load' });

/* app starts directly with zero loading delay */
try {
    await page.waitForSelector('#app.revealed', { timeout: 5000 });
} catch {
    console.log('(app did not reveal immediately)');
}
await page.waitForTimeout(500);

const dump = async (label) => {
    const data = await page.evaluate(() => {
        const box = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return `${sel}: MISSING`;
            const r = el.getBoundingClientRect();
            return `${sel}: x=${Math.round(r.x)} w=${Math.round(r.width)} sw=${el.scrollWidth} cw=${el.clientWidth}`;
        };
        const lines = [];
        for (const sel of ['.topbar', '.topbar-brand', '.topbar-meta', '.topbar-right', '.statusbar',
            '.status-leds', '.status-sim', '.app', '.main-grid', '.terminal-region', '.term-tabs',
            '.terminal-content', '.right-column', '.sidebar']) lines.push(box(sel));
        document.querySelectorAll('.meta-item').forEach((el, i) => {
            lines.push(`meta[${i}] w=${Math.round(el.getBoundingClientRect().width)} clipped=${el.scrollWidth > el.clientWidth + 1}`);
        });
        const out = document.querySelector('.terminal-content') || document.querySelector('.terminal-output');
        if (out) {
            lines.push(`output sw=${out.scrollWidth} cw=${out.clientWidth}`);
            for (const k of [...out.querySelectorAll('*')].slice(0, 120)) {
                if (k.scrollWidth > k.clientWidth + 1 && k.textContent.trim()) {
                    const cs = getComputedStyle(k);
                    lines.push(`WIDE ws="${cs.whiteSpace}" sw=${k.scrollWidth} cw=${k.clientWidth} "${(k.textContent || '').slice(0, 55)}"`);
                }
            }
        }
        lines.push(`doc scrollW=${document.documentElement.scrollWidth} innerW=${window.innerWidth}`);
        const over = [];
        document.querySelectorAll('body *').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.right > window.innerWidth + 1 && r.width > 0 && getComputedStyle(el).visibility !== 'hidden') {
                const c = typeof el.className === 'string' ? el.className : '';
                over.push(`${el.tagName}.${c}`.slice(0, 60) + `@${Math.round(r.right)}`);
            }
        });
        lines.push('OVERFLOWING: ' + [...new Set(over)].slice(0, 12).join(' | '));
        return lines.join('\n');
    });
    console.log(`\n===== ${label} =====\n${data}`);
};

await dump('DESKTOP 1440x900');

await page.evaluate(() => document.activeElement && document.activeElement.blur());
await page.keyboard.press('Shift+Slash');
await page.waitForSelector('#brief-modal.active', { timeout: 5000 });
await page.waitForTimeout(600);
await page.screenshot({ path: join(root, 'tools', 'shots', 'probe-brief.png') });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(800);
await dump('MOBILE 390x844');

for (const tab of ['monitor', 'network', 'log', 'terminal']) {
    await page.click(`.mtab[data-tab="${tab}"]`);
    await page.waitForTimeout(400);
    const info = await page.evaluate(() => {
        const vis = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).length;
        return `sidebar=${vis('.sidebar')} right=${vis('.right-column')} topo=${vis('.topo-panel')} evlog=${vis('.eventlog-panel')} scrollW=${document.documentElement.scrollWidth}`;
    });
    console.log(`tab ${tab}: ${info}`);
}
await page.screenshot({ path: join(root, 'tools', 'shots', 'probe-mobile.png') });

await browser.close();
server.close();

await page.goto(url, { waitUntil: 'load' });
