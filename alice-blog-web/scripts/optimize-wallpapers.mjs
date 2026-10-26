/**
 * Optimize the five local wallpapers into web-ready AVIF/WebP variants.
 *
 * Source images live outside the repository (they are large originals).
 * Only the generated files under public/wallpapers are committed.
 *
 * Usage:
 *   node scripts/optimize-wallpapers.mjs
 *   WALLPAPER_SOURCE_DIR="D:/path/to/wallpapers" node scripts/optimize-wallpapers.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir =
  process.env.WALLPAPER_SOURCE_DIR ||
  'C:\\Users\\Zpero\\Pictures\\siteWallpaper';
const outputDir = path.join(process.cwd(), 'public', 'wallpapers');

const wallpapers = [
  { file: '【哲风壁纸】Q版-动漫角色.jpg', name: 'chibi-characters' },
  { file: '【哲风壁纸】奥特曼-气泡-水下.jpg', name: 'ultraman-underwater' },
  { file: '【哲风壁纸】二次元少女-动漫插画.jpg', name: 'anime-girl-illustration' },
  { file: '【哲风壁纸】少女-星野-泳装.jpg', name: 'hoshino-swimsuit' },
  { file: '【哲风壁纸】云朵-伊蕾娜-窗边.jpg', name: 'elaina-window' },
];

const variants = [
  { suffix: '1920', width: 1920, avifQuality: 52, webpQuality: 78 },
  { suffix: '1080', width: 1080, avifQuality: 48, webpQuality: 74 },
];

await fs.mkdir(outputDir, { recursive: true });

for (const wallpaper of wallpapers) {
  const input = path.join(sourceDir, wallpaper.file);

  try {
    await fs.access(input);
  } catch {
    console.warn(`skip missing source: ${input}`);
    continue;
  }

  const metadata = await sharp(input).metadata();
  console.log(`${wallpaper.name}: ${metadata.width}x${metadata.height}`);

  for (const variant of variants) {
    const resized = () =>
      sharp(input).resize({
        width: variant.width,
        withoutEnlargement: true,
        fit: 'inside',
      });

    const avifPath = path.join(outputDir, `${wallpaper.name}-${variant.suffix}.avif`);
    const webpPath = path.join(outputDir, `${wallpaper.name}-${variant.suffix}.webp`);

    await resized().avif({ quality: variant.avifQuality, effort: 4 }).toFile(avifPath);
    await resized().webp({ quality: variant.webpQuality, effort: 4 }).toFile(webpPath);
  }
}

const files = (await fs.readdir(outputDir)).filter((file) => /\.(avif|webp)$/.test(file));
let total = 0;
for (const file of files) {
  total += (await fs.stat(path.join(outputDir, file))).size;
}
console.log(`generated ${files.length} files, ${(total / 1024 / 1024).toFixed(2)} MB total`);
