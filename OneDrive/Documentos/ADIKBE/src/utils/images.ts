import widthsManifest from '../data/image-widths.json';

const manifest = widthsManifest as Record<string, number[]>;

/**
 * Construye el valor de `srcset` para una imagen optimizada con
 * scripts/optimize-images.mjs, a partir del manifiesto de anchos generados
 * (src/data/image-widths.json). Devuelve undefined si el archivo no está en
 * el manifiesto (por ejemplo, imágenes subidas manualmente sin optimizar).
 */
export function buildSrcset(src: string, format: 'webp' | 'original'): string | undefined {
  const filename = src.split('/').pop() ?? '';
  const widths = manifest[filename];
  if (!widths) return undefined;

  const dir = src.slice(0, src.length - filename.length);
  const extMatch = filename.match(/\.[^.]+$/);
  const origExt = extMatch ? extMatch[0] : '';
  const base = origExt ? filename.slice(0, -origExt.length) : filename;

  return widths
    .map((w, i) => {
      const suffix = i === 0 ? '' : `-${w}w`;
      const name = format === 'webp' ? `${base}${suffix}.webp` : `${base}${suffix}${origExt}`;
      return `${dir}${name} ${w}w`;
    })
    .join(', ');
}

export function webpSrc(src: string): string {
  return src.replace(/\.(jpe?g|png)$/i, '.webp');
}
