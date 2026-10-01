/* ============================================================
   One-off generator for public/og.png (Open Graph share card).

       npm run og

   Renders an SVG mock of the terminal with the skull logo to a
   1200x630 PNG with sharp.
   ============================================================ */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoPath = join(root, 'public', 'logo-alpha.png');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="50%" cy="0%" r="120%">
      <stop offset="0%" stop-color="#0f3d2e" stop-opacity="0.75"/>
      <stop offset="60%" stop-color="#04120c" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#02060a"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#2ddc82" stroke-opacity="0.10" stroke-width="1"/>
    </pattern>
    <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#37ff8b" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#37ff8b" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="0" y="0" width="1200" height="630" fill="url(#scan)"/>

  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="#2ddc82" stroke-opacity="0.45" stroke-width="2"/>
  <rect x="36" y="36" width="1128" height="558" fill="none" stroke="#2ddc82" stroke-opacity="0.18" stroke-width="1"/>

  <!-- top strip -->
  <text x="64" y="92" font-family="Courier New, monospace" font-size="34" font-weight="bold"
        letter-spacing="5" fill="#4dffa0">&gt;# HACKERFEEL</text>
  <text x="490" y="92" font-family="Courier New, monospace" font-size="24" letter-spacing="4" fill="#4bbd82">// SPECTRE-9 BLACK-OPS</text>
  <line x1="64" y1="114" x2="1136" y2="114" stroke="#2ddc82" stroke-opacity="0.4"/>

  <!-- headline -->
  <text x="64" y="196" font-family="Courier New, monospace" font-size="64" font-weight="bold"
        letter-spacing="4" fill="#c8ffe0">HACKER TYPER</text>
  <text x="64" y="266" font-family="Courier New, monospace" font-size="64" font-weight="bold"
        letter-spacing="4" fill="#37ff8b">FAKE HACKER TERMINAL</text>

  <text x="64" y="318" font-family="Courier New, monospace" font-size="23" letter-spacing="1" fill="#7fe6ab">
    Feel like a movie hacker. Mash any key and code floods the screen.
  </text>

  <!-- fake terminal block -->
  <rect x="64" y="352" width="1072" height="176" rx="6" fill="#020806" fill-opacity="0.85"
        stroke="#2ddc82" stroke-opacity="0.35"/>
  <rect x="64" y="352" width="1072" height="30" rx="6" fill="#0a1616"/>
  <line x1="64" y1="382" x2="1136" y2="382" stroke="#2ddc82" stroke-opacity="0.3"/>
  <circle cx="84" cy="367" r="5" fill="#37ff8b"/>
  <circle cx="102" cy="367" r="5" fill="#ffb340"/>
  <circle cx="120" cy="367" r="5" fill="#ff4155"/>
  <text x="150" y="373" font-family="Courier New, monospace" font-size="16" letter-spacing="2" fill="#4bbd82">operator@hackerfeel:~$</text>

  <text x="86" y="414" font-family="Courier New, monospace" font-size="19" fill="#37ff8b">[OK] Bypassing honeypot grid ............. COMPLETE</text>
  <text x="86" y="444" font-family="Courier New, monospace" font-size="19" fill="#3fe0ff">[RX] Intercepting uplink // 4182 packets injected</text>
  <text x="86" y="474" font-family="Courier New, monospace" font-size="19" fill="#ffb340">[!!] Trace at 41% -- rerouting through 5 onion hops</text>
  <text x="86" y="504" font-family="Courier New, monospace" font-size="19" fill="#4dffa0">operator@hackerfeel:~$ breach --target CORE_</text>

  <!-- bottom strip -->
  <line x1="64" y1="552" x2="1136" y2="552" stroke="#2ddc82" stroke-opacity="0.4"/>
  <text x="64" y="584" font-family="Courier New, monospace" font-size="17" letter-spacing="1" fill="#ff6e7f">
    100% SIMULATED // NO REAL NETWORK ACTIVITY // FREE
  </text>
  <text x="1136" y="584" text-anchor="end" font-family="Courier New, monospace" font-size="17"
        letter-spacing="1" fill="#4bbd82">60+ COMMANDS // 5 CRT THEMES // hackerfeel.com</text>
</svg>`;

const logoResized = await sharp(logoPath)
    .resize(170, 170)
    .png()
    .toBuffer();

await sharp(Buffer.from(svg), { density: 96 })
    .resize(1200, 630)
    .composite([
        {
            input: logoResized,
            top: 140,
            left: 950,
            blend: 'screen'
        }
    ])
    .png({ compressionLevel: 9, palette: false })
    .toFile(join(root, 'public', 'og.png'));

console.log('public/og.png regenerated with HackerFeel skull logo');
