/* ============================================================
   tools/generate-favicons.mjs

   Generates maximized, high-contrast circular favicons for Chrome tab
   and Google Search preview.

   Maximizes the circular hacker skull to fill 96%+ of the tab
   icon area, eliminating excessive outer padding and nested
   margins so it is bold, crisp, and clearly legible even at 16x16.
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
    // Scale skull so it occupies 96.1% of canvas height (492px out of 512px)
    const skullH = 492;
    const skullW = Math.round(skullH * (skullMeta.width / skullMeta.height));
    const topOffset = Math.round((canvasSize - skullH) / 2);
    const leftOffset = Math.round((canvasSize - skullW) / 2);

    console.log(`Scaled skull on 512x512 canvas: ${skullW} x ${skullH} (at top=${topOffset}, left=${leftOffset})`);

    const themeConfigs = [
        {
            name: 'green',
            primary: '#37ff8b',
            accent: '#4dffa0',
            innerRing: '#25b364',
            bgStart: '#081e13',
            bgMid: '#020906',
            bgEnd: '#010403',
            hue: 0,
            sat: 1.0,
        },
        {
            name: 'cyan',
            primary: '#3fe0ff',
            accent: '#70ecff',
            innerRing: '#23a0ba',
            bgStart: '#03171e',
            bgMid: '#01090d',
            bgEnd: '#010305',
            hue: 60,
            sat: 1.3,
        },
        {
            name: 'amber',
            primary: '#ffb340',
            accent: '#ffcb65',
            innerRing: '#ba7a23',
            bgStart: '#1a1003',
            bgMid: '#0a0601',
            bgEnd: '#030200',
            hue: 290,
            sat: 1.5,
        },
        {
            name: 'red',
            primary: '#ff4155',
            accent: '#ff6e7f',
            innerRing: '#ba2335',
            bgStart: '#1a0408',
            bgMid: '#0a0204',
            bgEnd: '#040102',
            hue: 255,
            sat: 1.6,
        },
        {
            name: 'purple',
            primary: '#b98bff',
            accent: '#d4b3ff',
            innerRing: '#7d52ba',
            bgStart: '#14041e',
            bgMid: '#08020d',
            bgEnd: '#030105',
            hue: 170,
            sat: 1.4,
        },
    ];

    let greenMaster512 = null;

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

        // Circular background badge SVG
        // Radius 253 with 6px stroke touches exactly 256 (the edge of 512x512)
        const badgeSvg = `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="grad_${t.name}" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="${t.bgStart}"/>
      <stop offset="60%" stop-color="${t.bgMid}"/>
      <stop offset="100%" stop-color="${t.bgEnd}"/>
    </radialGradient>
  </defs>
  <!-- Full-bleed circular dark cyber disc -->
  <circle cx="256" cy="256" r="253" fill="url(#grad_${t.name})" stroke="${t.primary}" stroke-width="6" stroke-opacity="0.95"/>
  <!-- Subtle inner neon circuit track -->
  <circle cx="256" cy="256" r="247" fill="none" stroke="${t.innerRing}" stroke-width="2" stroke-opacity="0.45" stroke-dasharray="12 6"/>
</svg>`;

        const bgBuf = await sharp(Buffer.from(badgeSvg))
            .png()
            .toBuffer();

        // Composite skull on circular badge
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

    // 2. apple-touch-icon.png (180x180)
    const appleTouch = await sharp(greenMaster512)
        .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9 })
        .toBuffer();
    await writeFile(join(pub, 'apple-touch-icon.png'), appleTouch);
    console.log(`  -> Saved public/apple-touch-icon.png`);

    // 3. icon-192.png (PWA 192x192)
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
    const ico48 = await sharp(greenMaster512)
        .resize(48, 48, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();

    const icoBuf = createIco([
        { width: 16, height: 16, buffer: ico16 },
        { width: 32, height: 32, buffer: ico32 },
        { width: 48, height: 48, buffer: ico48 },
    ]);
    await writeFile(join(pub, 'favicon.ico'), icoBuf);
    console.log(`  -> Saved public/favicon.ico (16+32+48, ${icoBuf.length} bytes)`);

    // 6. favicon.svg (Crisp high-res vector wrapper around 512 master)
    const base64Master = greenMaster512.toString('base64');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="data:image/png;base64,${base64Master}" width="512" height="512"/></svg>`;
    await writeFile(join(pub, 'favicon.svg'), svgContent, 'utf-8');
    console.log(`  -> Saved public/favicon.svg`);

    console.log('\nAll Chrome tab favicons regenerated at MAX size successfully!');
}

main().catch((err) => {
    console.error('Failed to generate favicons:', err);
    process.exit(1);
});
