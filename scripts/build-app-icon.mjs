// One-off generator for the Capacitor asset sources (assets/*.png).
// Composes the brand mascot (src/assets/images/logo.png) onto the purple
// brand gradient, then `@capacitor/assets generate` fans these out into the
// platform icon/splash densities.
//
// Run: node scripts/build-app-icon.mjs   (then: npx @capacitor/assets generate)

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOGO = resolve(root, 'src/assets/images/logo.png');
const OUT = resolve(root, 'assets');

// Brand gradient (matches the home hero card): 45deg bottom-left → top-right.
const gradientSvg = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%"  stop-color="#7e6cf2"/>
      <stop offset="55%" stop-color="#6354d8"/>
      <stop offset="100%" stop-color="#afa9ec"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
</svg>`;

// Scale the logo so its WIDTH is `targetW`, keeping aspect ratio, and return
// a PNG buffer plus its rendered height.
async function scaledLogo(targetW) {
  const buf = await sharp(LOGO)
    .resize({ width: targetW, fit: 'inside' })
    .png()
    .toBuffer();
  const meta = await sharp(buf).metadata();
  return { buf, w: meta.width, h: meta.height };
}

// Gradient background with the logo centered on top.
async function gradientWithLogo(size, logoWidth, outFile) {
  const bg = await sharp(Buffer.from(gradientSvg(size))).png().toBuffer();
  const { buf, w, h } = await scaledLogo(logoWidth);
  await sharp(bg)
    .composite([{ input: buf, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toFile(outFile);
  console.log('wrote', outFile);
}

// Transparent canvas with the logo centered (adaptive-icon foreground).
async function transparentWithLogo(size, logoWidth, outFile) {
  const { buf, w, h } = await scaledLogo(logoWidth);
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: buf, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toFile(outFile);
  console.log('wrote', outFile);
}

await mkdir(OUT, { recursive: true });

// Legacy / iOS icon (opaque square): gradient + mascot, generous size.
await gradientWithLogo(1024, 640, resolve(OUT, 'icon-only.png'));

// Android adaptive icon: foreground (mascot in the 66% safe zone) over the
// gradient background. Foreground is kept smaller so circular/rounded masks
// never clip the planet.
await transparentWithLogo(1024, 520, resolve(OUT, 'icon-foreground.png'));
await sharp(Buffer.from(gradientSvg(1024))).png().toFile(resolve(OUT, 'icon-background.png'));
console.log('wrote', resolve(OUT, 'icon-background.png'));

// Splash screens: gradient + centered mascot (light + dark share the brand look).
await gradientWithLogo(2732, 900, resolve(OUT, 'splash.png'));
await gradientWithLogo(2732, 900, resolve(OUT, 'splash-dark.png'));
