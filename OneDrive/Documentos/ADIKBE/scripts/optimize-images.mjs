// Optimiza las imágenes de public/images (y el logo) para web:
// genera WebP + JPEG/PNG de respaldo en varios anchos (para <picture>/srcset),
// redimensionados a los anchos reales con los que se muestran en el sitio
// (ver src/styles/global.css: --max-width: 1120px, y los grids/carrusel que
// las contienen). Así un celular con mala conexión no descarga la imagen de
// tamaño escritorio.
//
// Uso: node scripts/optimize-images.mjs
import { readdir, mkdir, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC_DIR = path.join(ROOT, 'public', 'images');
// Optimiza en el mismo lugar: sobreescribe el .jpeg/.png original (más
// liviano, es el que queda como fallback de mayor calidad) y agrega
// variantes .webp / -{ancho}w junto a cada uno.
const OUT_DIR = SRC_DIR;
// Manifiesto que leen los componentes .astro para construir el srcset sin
// tener que adivinar/hardcodear qué anchos se generaron para cada imagen.
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'image-widths.json');

// Anchos generados por categoría, de mayor a menor. El primero (el mayor
// que quepa en la imagen original) se guarda SIN sufijo -> mismo nombre de
// archivo que ya referencian las páginas .astro (fallback / <img src>).
// Los demás se guardan como "base-{ancho}w.ext" para usarlos en srcset.
//
// Fondo del hero (full-bleed, puede llegar al ancho de pantallas grandes).
const HERO_WIDTHS = [1920, 1600, 1024, 640];
// Galerías dentro de tarjetas (grid--2 / grid--3 dentro de --max-width: 1120px).
const GALLERY_WIDTHS = [1000, 800, 480];

const HERO_FILES = new Set([
  'primera.jpeg', 'segunda.jpeg', 'tercera.jpeg', 'cuarta.jpeg', 'quinta.jpeg',
]);

const JPEG_QUALITY = 75;
const WEBP_QUALITY = 75;

// Los archivos generados llevan sufijo "-{ancho}w" (p. ej. primera-640w.jpeg).
// Sin este filtro, correr el script dos veces trataría esas salidas como
// fotos nuevas y generaría variantes de variantes (bug ya ocurrido una vez).
const GENERATED_SUFFIX = /-\d+w\.[a-z0-9]+$/i;

async function optimizeOne(file) {
  const inputPath = path.join(SRC_DIR, file);
  const ext = path.extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return null;
  if (GENERATED_SUFFIX.test(file)) return null;

  const widths = HERO_FILES.has(file) ? HERO_WIDTHS : GALLERY_WIDTHS;
  const base = path.basename(file, ext);
  const inputBuffer = await readFile(inputPath);
  const before = inputBuffer.length;

  // Se parte de un Buffer (no del archivo en disco) porque el respaldo se
  // reescribe sobre el mismo nombre de archivo original.
  const image = sharp(inputBuffer).rotate(); // respeta EXIF orientation
  const meta = await image.metadata();

  // No generar anchos más grandes que la imagen original (evita "upscale").
  const targetWidths = widths.filter((w) => !meta.width || w <= meta.width);
  // Si la imagen original ya es más angosta que todos los anchos de la
  // lista, se conserva su ancho nativo como variante más grande en vez de
  // forzarla al siguiente escalón (p. ej. no bajar una foto de 747px a 480px).
  if (meta.width && (targetWidths.length === 0 || targetWidths[0] < meta.width)) {
    targetWidths.unshift(meta.width);
  }

  const variants = [];
  for (let i = 0; i < targetWidths.length; i++) {
    const w = targetWidths[i];
    const isLargest = i === 0;
    const suffix = isLargest ? '' : `-${w}w`;

    const webpPath = path.join(OUT_DIR, `${base}${suffix}.webp`);
    await image.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toFile(webpPath);

    // El fallback sin sufijo reescribe el nombre/extensión original (las
    // páginas .astro ya apuntan a esa ruta como <img src>).
    const fallbackPath = isLargest ? path.join(OUT_DIR, file) : path.join(OUT_DIR, `${base}${suffix}${ext}`);
    const fallbackPipeline = image.clone().resize({ width: w, withoutEnlargement: true });
    if (ext === '.png') {
      await fallbackPipeline.png({ quality: JPEG_QUALITY, compressionLevel: 9 }).toFile(fallbackPath);
    } else {
      await fallbackPipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(fallbackPath);
    }

    variants.push({ width: w, webpSize: (await stat(webpPath)).size, fallbackSize: (await stat(fallbackPath)).size });
  }

  const largest = variants[0];
  return {
    file,
    before,
    afterWebp: largest.webpSize,
    afterFallback: largest.fallbackSize,
    width: largest.width,
    widths: targetWidths,
    variants,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(SRC_DIR)).filter((f) => !f.startsWith('.'));
  const results = [];
  for (const file of files) {
    const stats = await stat(path.join(SRC_DIR, file));
    if (!stats.isFile()) continue;
    const result = await optimizeOne(file);
    if (result) results.push(result);
  }

  // Logo (usado como placeholder pequeño en tarjetas de blog).
  const logoPath = path.join(ROOT, 'public', 'LogoSinFondo.png');
  const logoBuffer = await readFile(logoPath);
  const logoBefore = logoBuffer.length;
  const logoOutWebp = path.join(ROOT, 'public', 'LogoSinFondo.webp');
  const logoImg = sharp(logoBuffer);
  const logoMeta = await logoImg.metadata();
  const logoWidth = logoMeta.width && logoMeta.width > 800 ? 800 : undefined;
  await logoImg.clone().resize({ width: logoWidth, withoutEnlargement: true }).webp({ quality: 90 }).toFile(logoOutWebp);
  await logoImg.clone().resize({ width: logoWidth, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(logoPath);
  const logoAfterWebp = (await stat(logoOutWebp)).size;
  const logoAfterPng = (await stat(logoPath)).size;
  const logoFinalWidth = logoWidth ?? logoMeta.width;
  results.push({
    file: 'LogoSinFondo.png',
    before: logoBefore,
    afterWebp: logoAfterWebp,
    afterFallback: logoAfterPng,
    width: logoFinalWidth,
    widths: [logoFinalWidth],
  });

  // Manifiesto { "archivo.jpeg": [anchoMayor, ...anchosMenores] } para que
  // los componentes .astro sepan qué variantes -{ancho}w existen.
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  const manifest = Object.fromEntries(results.map((r) => [r.file, r.widths]));
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  const fmt = (n) => `${(n / 1024).toFixed(0)} KB`;
  let totalBefore = 0;
  let totalAfterWebp = 0;

  console.log('\nArchivo'.padEnd(28) + 'Antes'.padEnd(10) + 'WebP'.padEnd(10) + 'Fallback'.padEnd(10) + 'Ancho');
  for (const r of results) {
    totalBefore += r.before;
    totalAfterWebp += r.afterWebp;
    console.log(
      r.file.padEnd(28) + fmt(r.before).padEnd(10) + fmt(r.afterWebp).padEnd(10) + fmt(r.afterFallback).padEnd(10) + `${r.width}px`
    );
  }

  console.log('\n--- Totales ---');
  console.log(`Antes:        ${fmt(totalBefore)}`);
  console.log(`Después (WebP): ${fmt(totalAfterWebp)}  (-${(100 - (totalAfterWebp / totalBefore) * 100).toFixed(0)}%)`);

  const speeds = [
    { label: '3G lento (400 kbps)', kbps: 400 },
    { label: '4G típico (4 Mbps)', kbps: 4000 },
    { label: 'Banda ancha (25 Mbps)', kbps: 25000 },
  ];
  console.log('\n--- Tiempo de carga estimado (todas las imágenes juntas) ---');
  for (const s of speeds) {
    const before = (totalBefore * 8) / (s.kbps * 1000);
    const after = (totalAfterWebp * 8) / (s.kbps * 1000);
    console.log(`${s.label.padEnd(24)} antes: ${before.toFixed(1)}s  →  después: ${after.toFixed(1)}s`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
