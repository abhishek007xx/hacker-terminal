/* ad-hoc: measure .topbar-meta at a given width — node tools/check-meta.mjs 768 */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const PORT = 4479;
const WIDTH = Number(process.argv[2] || 768);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
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
const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
await page.waitForSelector('#app.revealed', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1200);
console.log(await page.evaluate(() => {
    const out = [];
    const m = document.querySelector('.topbar-meta');
    const cs = getComputedStyle(m);
    const r = m.getBoundingClientRect();
    out.push(`meta: w=${Math.round(r.width)} x=${Math.round(r.x)} y=${Math.round(r.y)} flex=${cs.flex} display=${cs.display} clip=${m.scrollWidth > m.clientWidth + 1}`);
    [...m.children].forEach((c, i) => {
        const cr = c.getBoundingClientRect();
        out.push(`  item${i}: x=${Math.round(cr.x)} y=${Math.round(cr.y)} w=${Math.round(cr.width)} [${c.textContent.trim()}] clipped=${c.scrollWidth > c.clientWidth + 1}`);
    });
    const right = document.querySelector('.topbar-right').getBoundingClientRect();
    out.push(`right: x=${Math.round(right.x)} y=${Math.round(right.y)} w=${Math.round(right.width)}`);
    out.push(`doc overflow: ${document.documentElement.scrollWidth - window.innerWidth}`);
    return out.join('\n');
}));
await browser.close();
server.close();
