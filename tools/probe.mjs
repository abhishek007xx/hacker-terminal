/* ============================================================
   Layout probe — quick diagnostics for responsive/overflow issues.

       node tools/probe.mjs

Serves ./dist, enters the app, then dumps bounding boxes / overflow
measurements at desktop + mobile viewports. Facts for tuning CSS.
Screenshots land in tools/shots/probe-*.png.
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
        // titlebar internals
        const tt = document.querySelector('.term-tabs');
        if (tt) {
            const cs = getComputedStyle(tt);
            const p = tt.parentElement;
            const pcs = getComputedStyle(p);
            const r = p.getBoundingClientRect();
            lines.push(`tt: flex=${cs.flex} minW=${cs.minWidth} ovx=${cs.overflowX} | parent=<${p.tagName} class="${p.className}"> disp=${pcs.display} w=${Math.round(r.width)} gap=${pcs.gap} justify=${pcs.justifyContent}`);
            const ctl = p.querySelector('.panel-controls');
            if (ctl) {
                const cr = ctl.getBoundingClientRect();
                lines.push(`controls: w=${Math.round(cr.width)} x=${Math.round(cr.x)} children=${ctl.children.length} flexShrink=${getComputedStyle(ctl).flexShrink}`);
                for (const c of ctl.children) lines.push(`  ctl-kid <${c.tagName} class="${c.className}"> w=${Math.round(c.getBoundingClientRect().width)}`);
            }
            lines.push(`tt box: x=${Math.round(tt.getBoundingClientRect().x)} w=${Math.round(tt.getBoundingClientRect().width)}`);
            lines.push(`tt detail: pos=${cs.position} disp=${cs.display} maxW=${cs.maxWidth} w=${cs.width} basis=${cs.flexBasis} grow=${cs.flexGrow} float=${cs.float} box=${cs.boxSizing}`);
            const pb = getComputedStyle(p, '::before');
            const pa = getComputedStyle(p, '::after');
            lines.push(`titlebar kids=${p.children.length}: ${[...p.children].map((c) => `<${c.tagName}.${c.className}>${Math.round(c.getBoundingClientRect().width)}`).join(' ')} | ::before="${pb.content}" ::after="${pa.content}"`);
            const cb = getComputedStyle(p);
            lines.push(`titlebar: pos=${cb.position} disp=${cb.display} w=${Math.round(r.width)} padL=${cb.paddingLeft} padR=${cb.paddingRight}`);
        }
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

/* intermediate widths — the 1000-1600 range hides meta items progressively */
for (const w of [768, 1024, 1600]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(600);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`width ${w}: doc overflow ${over > 0 ? over + 'px OVERFLOW' : '0px ok'}`);
    await page.screenshot({ path: join(root, 'tools', 'shots', `probe-${w}.png`) });
}

await browser.close();
server.close();

