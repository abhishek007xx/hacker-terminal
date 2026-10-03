/* ============================================================
   tools/generate-favicons.mjs

   Generates authentic circular hooded skull favicons matching the
   approved SPECTRE-9 / Hacker Feel brand badge:
   - Exact close-up circular frame matching topbar (># SPECTRE-9)
   - Hooded skull fills the circle completely (no shrunken appearance)
   - No wide shoulders or vertical drip lines
   - Solid #000000 black canvas (prevents Google Search white circle injection)
   - Crisp outer neon ring with ambient glow
   - Primary default is Cyan (matching user reference), with all 5 CRT themes supported:
     cyan, green, amber, red, purple
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

    const canvasSize = 512;
    const ringRadius = 246;

    // The scale(2.45) translateY(18%) transformation matches the topbar brand badge
    const scaledSize = Math.round(canvasSize * 2.45); // 1254
    const cropLeft = Math.round((scaledSize - canvasSize) / 2); // 371
    const cropTop = Math.round((scaledSize - canvasSize) / 2 - canvasSize * 0.18); // 279

    const maskSvg = Buffer.from(
        `<svg width="${canvasSize}" height="${canvasSize}"><circle cx="256" cy="256" r="${ringRadius - 1}" fill="#fff"/></svg>`
    );

    const themeConfigs = [
        {
            name: 'cyan',
            primary: '#3fe0ff',
            accent: '#70ecff',
            hue: 60,
            sat: 1.3,
        },
        {
            name: 'green',
            primary: '#37ff8b',
            accent: '#4dffa0',
            hue: 0,
            sat: 1.0,
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

    let primaryMaster512 = null;

    for (const t of themeConfigs) {
        console.log(`Generating theme favicon: ${t.name}...`);

        let skull = sharp(logoAlphaPath);
        if (t.hue !== 0) {
            skull = skull.modulate({ hue: t.hue, saturation: t.sat });
        }

        const scaledSkull = await skull.resize(scaledSize, scaledSize).toBuffer();

        // Extract the centered 512x512 face crop (fills the circle, no wide shoulders/drips)
        const extracted = await sharp(scaledSkull)
            .extract({
                left: cropLeft,
                top: cropTop,
                width: canvasSize,
                height: canvasSize,
            })
            .toBuffer();

        // Mask the extracted skull strictly within the circle
        const maskedSkull = await sharp(extracted)
            .composite([{ input: maskSvg, blend: 'dest-in' }])
            .png()
            .toBuffer();

        // Transparent background outside circle — Chrome tab shows clean circle, no black box
        const badgeSvg = `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ringGlow_${t.name}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <!-- Dark fill ONLY inside the circle — outside is transparent -->
  <circle cx="256" cy="256" r="${ringRadius}" fill="#050505"/>
  <!-- Ambient soft glow ring -->
  <circle cx="256" cy="256" r="${ringRadius}" fill="none" stroke="${t.primary}" stroke-width="12" stroke-opacity="0.4" filter="url(#ringGlow_${t.name})"/>
  <!-- Crisp neon circular border -->
  <circle cx="256" cy="256" r="${ringRadius}" fill="none" stroke="${t.primary}" stroke-width="5" stroke-opacity="0.95"/>
</svg>`;

        // Composite masked skull onto circular glowing badge
        const master512 = await sharp(Buffer.from(badgeSvg))
            .composite([
                {
                    input: maskedSkull,
                    top: 0,
                    left: 0,
                },
            ])
            .png({ compressionLevel: 9 })
            .toBuffer();

        // Primary master is Cyan (matches user screenshot preference)
        if (t.name === 'cyan') {
            primaryMaster512 = master512;
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

    // Generate root icon assets from primaryMaster512 (Cyan)
    console.log('Generating root icon assets from primary master...');

    // 1. favicon-32.png
    const fav32 = await sharp(primaryMaster512)
        .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9 })
        .toBuffer();
    await writeFile(join(pub, 'favicon-32.png'), fav32);
    console.log(`  -> Saved public/favicon-32.png`);

    // 2. apple-touch-icon.png (180x180)
    const appleTouch = await sharp(primaryMaster512)
        .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9 })
        .toBuffer();
    await writeFile(join(pub, 'apple-touch-icon.png'), appleTouch);
    console.log(`  -> Saved public/apple-touch-icon.png`);

    // 3. icon-192.png (PWA 192x192)
    const icon192 = await sharp(primaryMaster512)
        .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9 })
        .toBuffer();
    await writeFile(join(pub, 'icon-192.png'), icon192);
    console.log(`  -> Saved public/icon-192.png`);

    // 4. icon-512.png (PWA 512x512)
    await writeFile(join(pub, 'icon-512.png'), primaryMaster512);
    console.log(`  -> Saved public/icon-512.png`);

    // 5. favicon.ico with 16x16, 32x32, 48x48
    const ico16 = await sharp(primaryMaster512)
        .resize(16, 16, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
    const ico32 = fav32;
    const ico48 = await sharp(primaryMaster512)
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

    // 6. favicon.svg (High-res vector wrapper around 512 master — transparent outside circle)
    const base64Master = primaryMaster512.toString('base64');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="data:image/png;base64,${base64Master}" width="512" height="512"/></svg>`;
    await writeFile(join(pub, 'favicon.svg'), svgContent, 'utf-8');
    console.log(`  -> Saved public/favicon.svg`);

    console.log('\nAll favicons generated successfully matching approved circular hooded skull badge!');
}

main().catch((err) => {
    console.error('Failed to generate favicons:', err);
    process.exit(1);
});
