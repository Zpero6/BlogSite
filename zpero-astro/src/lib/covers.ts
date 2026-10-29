import type { ImageMetadata } from 'astro';

const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/covers/*.{avif,gif,jpeg,jpg,png,webp}',
  { eager: true },
);

const covers = new Map<string, ImageMetadata>();

for (const [path, module] of Object.entries(modules)) {
  const filename = path.split('/').pop();
  if (filename) covers.set(filename, module.default);
}

const extensions = ['webp', 'avif', 'png', 'jpg', 'jpeg', 'gif'];

export function resolveCover(explicitCover: string | undefined, slug: string): ImageMetadata {
  if (explicitCover) {
    const selected = covers.get(explicitCover);
    if (!selected) {
      throw new Error(
        `文章 ${slug} 指定的封面 ${explicitCover} 不存在。请将图片上传到 src/assets/covers/。`,
      );
    }
    return selected;
  }

  for (const extension of extensions) {
    const matched = covers.get(`${slug}.${extension}`);
    if (matched) return matched;
  }

  const fallback = covers.get('default.webp');
  if (!fallback) throw new Error('缺少默认封面 src/assets/covers/default.webp');
  return fallback;
}
