/* ============================================================
   tools/generate-favicons.mjs

   Generates authentic circular hacker skull favicons matching the
   SPECTRE-9 brand logo from the topbar:
   - Exact circular frame with glowing neon boundary ring
   - Beautifully proportioned hooded hacker skull (apex, eyes, teeth)
   - Solid #000000 black background (NO transparency) so Google
     Search never injects an unsightly white circular card
   - All 5 CRT themes supported: green, cyan, amber, red, purple
   ============================================================ */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const favDir = join(pub, 'favicons');
const logoAlphaPath = join(pub, 'logo-alpha.png');

function createIco(images) {
    const count = images.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    let offset = headerSize + count * dirEntrySize;

    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // icon type (1 = icon)
    header.writeUInt16LE(count, 4); // image count

    const entries = [];
    for (const img of images) {
        const entry = Buffer.alloc(dirEntrySize);
        entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
        entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
        entry.writeUInt8(0, 2); // color count
        entry.writeUInt8(0, 3); // reserved
        entry.writeUInt16LE(1, 4); // color planes
        entry.writeUInt16LE(32, 6); // bit count
        entry.writeUInt32LE(img.buffer.length, 8); // size
        entry.writeUInt32LE(offset, 12); // offset
        entries.push(entry);
        offset += img.buffer.length;
    }

    return Buffer.concat([header, ...entries, ...images.map((i) => i.buffer)]);
}

async function main() {
    await mkdir(favDir, { recursive: true });

    // 1. Extract and trim skull from logo-alpha.png
    console.log('Reading source skull from public/logo-alpha.png...');
    const trimmedSkull = await sharp(logoAlphaPath)
        .trim({ threshold: 20 })
        .toBuffer();

    const skullMeta = await sharp(trimmedSkull).metadata();
    console.log(`Trimmed skull dimensions: ${skullMeta.width} x ${skullMeta.height}`);

    const canvasSize = 512;
    // Sized to 410px height: preserves the hood shape, apex, and circular neon frame
    // exactly like the topbar brand logo
    const skullH = 410;
    const skullW = Math.round(skullH * (skullMeta.width / skullMeta.height));
    const topOffset = Math.round((canvasSize - skullH) / 2);
    const leftOffset = Math.round((canvasSize - skullW) / 2);

    console.log(`Skull on 512x512 canvas: ${skullW} x ${skullH} (at top=${topOffset}, left=${leftOffset})`);

    const themeConfigs = [
        {
            name: 'green',
            primary: '#37ff8b',
            accent: '#4dffa0',
            hue: 0,
            sat: 1.0,
        },
        {
            name: 'cyan',
            primary: '#3fe0ff',
            accent: '#70ecff',
            hue: 60,
            sat: 1.3,
        },
        {
            name: 'amber',
            primary: '#ffb340',
            accent: '#ffcb65',
            hue: 290,
            sat: 1.5,
        },
        {
            name: 'red',
            primary: '#ff4155',
            accent: '#ff6e7f',
            hue: 255,
            sat: 1.6,
        },
        {
            name: 'purple',
            primary: '#b98bff',
            accent: '#d4b3ff',
            hue: 170,
            sat: 1.4,
        },
    ];

    let greenMaster512 = null;
    const ringRadius = 242;

    for (const t of themeConfigs) {
        console.log(`Generating theme favicon: ${t.name}...`);

        // Prepare color-shifted skull
        let skullImg = sharp(trimmedSkull);
        if (t.hue !== 0) {
            skullImg = skullImg.modulate({ hue: t.hue, saturation: t.sat });
        }
        const resizedSkullBuf = await skullImg
            .resize(skullW, skullH, { fit: 'fill' })
            .toBuffer();

        // Solid #000000 background (NO transparency) with glowing circular neon ring
        const badgeSvg = `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <!-- Solid black background - prevents Google Search white circle injection -->
  <rect width="${canvasSize}" height="${canvasSize}" fill="#000000"/>
  <defs>
    <filter id="ringGlow_${t.name}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <!-- Ambient soft glow ring -->
  <circle cx="256" cy="256" r="${ringRadius}" fill="#000000" stroke="${t.primary}" stroke-width="14" stroke-opacity="0.35" filter="url(#ringGlow_${t.name})"/>
  <!-- Crisp neon circular border (matches brand logo) -->
  <circle cx="256" cy="256" r="${ringRadius}" fill="#000000" stroke="${t.primary}" stroke-width="6" stroke-opacity="0.95"/>
</svg>`;

        const bgBuf = await sharp(Buffer.from(badgeSvg))
            .png()
            .toBuffer();

        // Composite skull inside circular badge
        const master512 = await sharp(bgBuf)
            .composite([
                {
                    input: resizedSkullBuf,
                    top: topOffset,
                    left: leftOffset,
                },
            ])
            .png({ compressionLevel: 9 })
            .toBuffer();

        if (t.name === 'green') {
            greenMaster512 = master512;
        }

        // Save 128x128 theme favicon
        const fav128 = await sharp(master512)
            .resize(128, 128, { kernel: sharp.kernel.lanczos3 })
            .png({ compressionLevel: 9 })
            .toBuffer();

        const outPath = join(favDir, `favicon-${t.name}.png`);
        await writeFile(outPath, fav128);
        console.log(`  -> Saved ${outPath} (${fav128.length} bytes)`);
    }

    // Generate root icon assets from greenMaster512
    console.log('Generating root icon assets from green master...');

    // 1. favicon-32.png
    const fav32 = await sharp(greenMaster512)
        .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9 })
        .toBuffer();
    await writeFile(join(pub, 'favicon-32.png'), fav32);
    console.log(`  -> Saved public/favicon-32.png`);

    // 1b. favicon-48.png (Google Search primary 48px square standard)
    const fav48 = await sharp(greenMaster512)
        .resize(48, 48, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9 })
        .toBuffer();
    await writeFile(join(pub, 'favicon-48.png'), fav48);
    console.log(`  -> Saved public/favicon-48.png`);

    // 1c. favicon-96.png (Google Search 2x retina standard)
    const fav96 = await sharp(greenMaster512)
        .resize(96, 96, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9 })
        .toBuffer();
    await writeFile(join(pub, 'favicon-96.png'), fav96);
    console.log(`  -> Saved public/favicon-96.png`);

    // 2. apple-touch-icon.png (180x180)
    const appleTouch = await sharp(greenMaster512)
        .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9 })
        .toBuffer();
    await writeFile(join(pub, 'apple-touch-icon.png'), appleTouch);
    console.log(`  -> Saved public/apple-touch-icon.png`);

    // 3. icon-192.png (PWA 192x192, 4x Google 48px multiple)
    const icon192 = await sharp(greenMaster512)
        .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9 })
        .toBuffer();
    await writeFile(join(pub, 'icon-192.png'), icon192);
    console.log(`  -> Saved public/icon-192.png`);

    // 4. icon-512.png (PWA 512x512)
    await writeFile(join(pub, 'icon-512.png'), greenMaster512);
    console.log(`  -> Saved public/icon-512.png`);

    // 5. favicon.ico with 16x16, 32x32, 48x48
    const ico16 = await sharp(greenMaster512)
        .resize(16, 16, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
    const ico32 = fav32;
    const ico48 = fav48;

    const icoBuf = createIco([
        { width: 16, height: 16, buffer: ico16 },
        { width: 32, height: 32, buffer: ico32 },
        { width: 48, height: 48, buffer: ico48 },
    ]);
    await writeFile(join(pub, 'favicon.ico'), icoBuf);
    console.log(`  -> Saved public/favicon.ico (16+32+48, ${icoBuf.length} bytes)`);

    // 6. favicon.svg (High-res vector wrapper around 512 master with solid #000000 canvas)
    const base64Master = greenMaster512.toString('base64');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" fill="#000000"/><image href="data:image/png;base64,${base64Master}" width="512" height="512"/></svg>`;
    await writeFile(join(pub, 'favicon.svg'), svgContent, 'utf-8');
    console.log(`  -> Saved public/favicon.svg`);

    console.log('\nAll favicons generated matching brand logo with zero white space!');
}

main().catch((err) => {
    console.error('Failed to generate favicons:', err);
    process.exit(1);
});
