/* ad-hoc: close-up shots of the terminal titlebar + topology panel
   — node tools/shot-ui.mjs */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const shots = join(root, 'tools', 'shots');
const PORT = 4401;

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
await mkdir(shots, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
await page.waitForSelector('#app.revealed', { timeout: 5000 });
await page.waitForFunction(() => window.Terminal && !window.Terminal.busy, { timeout: 15000 });
await page.waitForTimeout(800);

// 1. desktop titlebar close-up (before any interaction — typer mode idle)
const tb = await page.locator('.terminal-region .panel-titlebar');
await tb.screenshot({ path: join(shots, 'ui-titlebar.png') });

// measure alignment facts
console.log(await page.evaluate(() => {
    const bar = document.querySelector('.terminal-region .panel-titlebar');
    const tabs = [...document.querySelectorAll('.term-tab')].map((t) => {
        const r = t.getBoundingClientRect();
        return `tab w=${Math.round(r.width)} top=${Math.round(r.top)} bottom=${Math.round(r.bottom)}`;
    });
    const ctl = bar.querySelector('.panel-controls').getBoundingClientRect();
    const tt = document.querySelector('.term-tabs');
    return {
        tabs, bar: `bar h=${Math.round(bar.getBoundingClientRect().height)}`,
        ctl: `ctl top=${Math.round(ctl.top)} bottom=${Math.round(ctl.bottom)}`,
        tabsScroll: `term-tabs sw=${tt.scrollWidth} cw=${tt.clientWidth}`,
        pillGone: !document.getElementById('term-active-pill'),
        hintVisible: getComputedStyle(document.getElementById('typer-hint')).display !== 'none',
        promptHidden: getComputedStyle(document.getElementById('terminal-prompt')).display === 'none',
    };
}));

// 2. input line close-up (typer-mode hint should show, no shell prompt)
await page.locator('#terminal-inputline').screenshot({ path: join(shots, 'ui-inputline-typer.png') });

// 3. topology panel after a few seconds of simulation
await page.waitForTimeout(2500);
const topo = page.locator('.topo-panel');
await topo.screenshot({ path: join(shots, 'ui-topo.png') });

// 4. hover a node to exercise the readout chip
const box = await page.locator('#topo-canvas').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 6); // CORE is center; try node-04 below
await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.82, { steps: 4 });
await page.waitForTimeout(300);
await topo.screenshot({ path: join(shots, 'ui-topo-hover.png') });
// click-to-ping
await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.82);
await page.waitForTimeout(450);
await topo.screenshot({ path: join(shots, 'ui-topo-ping.png') });

// 5. command mode: prompt must come back
await page.click('#tab-mode-command');
await page.waitForTimeout(400);
console.log(await page.evaluate(() => ({
    promptBack: getComputedStyle(document.getElementById('terminal-prompt')).display !== 'none',
    hintHidden: getComputedStyle(document.getElementById('typer-hint')).display === 'none',
    bodyClass: document.body.className,
})));
await page.locator('#terminal-inputline').screenshot({ path: join(shots, 'ui-inputline-command.png') });

// 6. mobile titlebar (390)
await page.click('#tab-mode-typer');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
const tbM = await page.locator('.terminal-region .panel-titlebar');
await tbM.screenshot({ path: join(shots, 'ui-titlebar-mobile.png') });
console.log(await page.evaluate(() => {
    const tt = document.querySelector('.term-tabs');
    return `mobile term-tabs sw=${tt.scrollWidth} cw=${tt.clientWidth}`;
}));

await browser.close();
server.close();
