/**
 * Optimiza las imagenes publicas reutilizables del sitio antiguo (lista A).
 *
 * REGLA CRITICA: este script SOLO procesa las rutas listadas en SOURCES.
 * Las fotos privadas de clientes (images/portafolio/ e images/categories/)
 * nunca se leen, se copian ni se publican.
 *
 * Por cada imagen genera AVIF + WebP en varios anchos, un JPEG de respaldo,
 * un LQIP en base64 y las dimensiones reales, y lo deja todo descrito en
 * frontend/src/data/images.json para que los componentes no adivinen nada.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const LEGACY_IMAGES = path.join(ROOT, 'images');
const OUT_DIR = path.join(ROOT, 'frontend', 'public', 'media');
const MANIFEST = path.join(ROOT, 'frontend', 'src', 'data', 'images.json');

const WIDTHS = [480, 640, 800, 1200, 1920];

// Lista A unicamente. Clasificacion confirmada con el cliente el 2026-10-22.
const SOURCES = [
  { key: 'hero',          file: 'background.jpg',                role: 'hero',     alt: 'Pareja fotografiada a contraluz durante un evento social' },
  { key: 'portrait',      file: 'photographer_profile_1.jpg',    role: 'portrait', alt: 'Sebastian Sisa, fotografo, con su camara' },
  { key: 'portraitAlt',   file: 'photographer_profile_2.jpg',    role: 'portrait', alt: 'Sebastian Sisa durante una sesion de fotos' },
  { key: 'serviceEvents', file: 'servicios/eventos.jpg',         role: 'service',  alt: 'Celebracion de un evento social registrada en fotografia' },
  { key: 'serviceVideo',  file: 'servicios/videografia.jpg',     role: 'service',  alt: 'Camara de video grabando durante una produccion' },
  { key: 'servicePortrait', file: 'servicios/retrato.jpg',       role: 'service',  alt: 'Retrato de estudio con iluminacion suave' },
  { key: 'serviceCommercial', file: 'servicios/comercial.jpg',   role: 'service',  alt: 'Fotografia comercial de producto en estudio' },
];

// Rutas que NUNCA deben tocarse. Si alguna aparece en SOURCES, abortamos.
const FORBIDDEN = ['portafolio/', 'categories/', 'categories_test/'];

function assertAllowed(file) {
  const normalized = file.split(path.sep).join(String.fromCharCode(47));
  for (const blocked of FORBIDDEN) {
    if (normalized.includes(blocked)) {
      throw new Error(
        `ABORTADO: "${file}" pertenece a las fotos privadas de clientes (lista B). ` +
        'Estas imagenes no se migran, no se optimizan y no se publican.'
      );
    }
  }
}

async function lqip(input) {
  const buf = await sharp(input).resize(20, null, { fit: 'inside' }).webp({ quality: 35 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function processOne(entry) {
  assertAllowed(entry.file);
  const input = path.join(LEGACY_IMAGES, entry.file);
  if (!fs.existsSync(input)) {
    console.warn(`  ! no encontrada, se omite: ${entry.file}`);
    return null;
  }

  const image = sharp(input).rotate(); // rotate() sin argumentos aplica la orientacion EXIF
  const meta = await image.metadata();
  const srcW = meta.width;
  const srcH = meta.height;
  const ratio = srcH / srcW;
  const original = fs.statSync(input).size;

  const widths = WIDTHS.filter((w) => w <= srcW);
  if (widths.length === 0) widths.push(srcW);

  const variants = { avif: [], webp: [] };
  let totalOut = 0;

  for (const w of widths) {
    const base = sharp(input).rotate().resize(w, null, { withoutEnlargement: true });

    const avifPath = path.join(OUT_DIR, `${entry.key}-${w}.avif`);
    await base.clone().avif({ quality: 52, effort: 5 }).toFile(avifPath);
    variants.avif.push({ w, url: `/media/${entry.key}-${w}.avif` });
    totalOut += fs.statSync(avifPath).size;

    const webpPath = path.join(OUT_DIR, `${entry.key}-${w}.webp`);
    await base.clone().webp({ quality: 74 }).toFile(webpPath);
    variants.webp.push({ w, url: `/media/${entry.key}-${w}.webp` });
    totalOut += fs.statSync(webpPath).size;
  }

  // JPEG de respaldo al ancho mayor, para navegadores sin WebP/AVIF
  const widest = widths[widths.length - 1];
  const jpgPath = path.join(OUT_DIR, `${entry.key}-${widest}.jpg`);
  await sharp(input).rotate().resize(widest, null, { withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(jpgPath);
  totalOut += fs.statSync(jpgPath).size;

  console.log(
    `  ${entry.key.padEnd(18)} ${srcW}x${srcH}  ${(original / 1048576).toFixed(2)} MB` +
    ` -> ${(totalOut / 1048576).toFixed(2)} MB en ${widths.length * 2 + 1} archivos`
  );

  return [entry.key, {
    alt: entry.alt,
    role: entry.role,
    width: widest,
    height: Math.round(widest * ratio),
    aspectRatio: Number((srcW / srcH).toFixed(4)),
    lqip: await lqip(input),
    fallback: `/media/${entry.key}-${widest}.jpg`,
    avif: variants.avif,
    webp: variants.webp,
  }];
}

async function copyLogos() {
  const logos = [
    { from: 'logo.png', to: 'logo.png' },
    { from: 'logo_3.png', to: 'favicon.png' },
  ];
  for (const l of logos) {
    const src = path.join(LEGACY_IMAGES, l.from);
    if (!fs.existsSync(src)) continue;
    await sharp(src).png({ compressionLevel: 9, palette: true })
      .toFile(path.join(OUT_DIR, l.to));
    // Version WebP del logo para el header
    await sharp(src).webp({ quality: 90 })
      .toFile(path.join(OUT_DIR, l.to.replace('.png', '.webp')));
  }
  console.log('  logos copiados y comprimidos');
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });

  console.log('Optimizando imagenes publicas (lista A):');
  const entries = [];
  for (const entry of SOURCES) {
    const result = await processOne(entry);
    if (result) entries.push(result);
  }
  await copyLogos();

  fs.writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(entries), null, 2) + '\n');
  console.log(`\nManifiesto escrito en ${path.relative(ROOT, MANIFEST)} (${entries.length} imagenes)`);
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
