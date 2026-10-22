import crypto from 'node:crypto';
import sharp from 'sharp';
import { upload } from './storage.js';

/**
 * Procesa una foto recien subida.
 *
 * Es el mismo trabajo que hace scripts/optimize-images.cjs con las imagenes
 * del sitio antiguo, pero en caliente: lo que el fotografo sube desde el
 * celular queda servido en AVIF y WebP en varios anchos, sin que el tenga
 * que saber que existe esa palabra.
 *
 * Pasos:
 *   1. Corregir la orientacion EXIF (si no, las fotos verticales salen
 *      acostadas en muchos navegadores).
 *   2. Descartar todos los metadatos. Esto borra el GPS: las fotos de un
 *      evento social no deben publicar donde vive nadie.
 *   3. Generar las variantes y la miniatura.
 *   4. Generar el LQIP que el sitio muestra borroso mientras carga.
 */

const WIDTHS = [480, 640, 800, 1200, 1920];
const THUMB_WIDTH = 400;

/** Un nombre corto, unico y sin acentos ni espacios. */
function buildBaseName(originalName) {
  const stem = (originalName || 'foto')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'foto';

  return `${stem}-${crypto.randomBytes(5).toString('hex')}`;
}

async function makeLqip(input) {
  const buf = await sharp(input)
    .resize(20, null, { fit: 'inside' })
    .webp({ quality: 35 })
    .toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

/**
 * @param {Buffer} buffer  archivo tal como llego
 * @param {string} originalName  nombre original, solo para construir la ruta
 * @param {string} albumSlug  carpeta destino dentro del bucket
 */
export async function processAndUpload(buffer, originalName, albumSlug) {
  // rotate() sin argumentos aplica la orientacion EXIF antes de redimensionar
  const base = sharp(buffer, { failOn: 'error' }).rotate();
  const meta = await base.metadata();

  if (!meta.width || !meta.height) {
    throw new Error('El archivo no parece una imagen válida.');
  }

  const baseName = buildBaseName(originalName);
  const folder = `albums/${albumSlug}`;
  const ratio = meta.height / meta.width;

  const widths = WIDTHS.filter((w) => w <= meta.width);
  if (widths.length === 0) widths.push(meta.width);

  const variants = { avif: [], webp: [] };
  let bytes = 0;

  for (const w of widths) {
    // withMetadata() no se llama en ningun momento: sharp descarta EXIF,
    // incluido el GPS, salvo que se le pida conservarlo explicitamente.
    const resized = sharp(buffer).rotate().resize(w, null, { withoutEnlargement: true });

    const avifBuf = await resized.clone().avif({ quality: 52, effort: 4 }).toBuffer();
    const avif = await upload(`${folder}/${baseName}-${w}.avif`, avifBuf, 'image/avif');
    variants.avif.push({ w, url: avif.url });
    bytes += avifBuf.length;

    const webpBuf = await resized.clone().webp({ quality: 74 }).toBuffer();
    const webp = await upload(`${folder}/${baseName}-${w}.webp`, webpBuf, 'image/webp');
    variants.webp.push({ w, url: webp.url });
    bytes += webpBuf.length;
  }

  // JPEG de respaldo al ancho mayor, para navegadores sin AVIF ni WebP
  const widest = widths[widths.length - 1];
  const jpgBuf = await sharp(buffer)
    .rotate()
    .resize(widest, null, { withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toBuffer();
  const fallback = await upload(`${folder}/${baseName}-${widest}.jpg`, jpgBuf, 'image/jpeg');
  bytes += jpgBuf.length;

  // Miniatura cuadrada para las rejillas del panel
  const thumbBuf = await sharp(buffer)
    .rotate()
    .resize(THUMB_WIDTH, THUMB_WIDTH, { fit: 'cover', position: 'attention' })
    .webp({ quality: 72 })
    .toBuffer();
  const thumb = await upload(`${folder}/${baseName}-thumb.webp`, thumbBuf, 'image/webp');
  bytes += thumbBuf.length;

  return {
    storagePath: `${folder}/${baseName}-${widest}.jpg`,
    width: widest,
    height: Math.round(widest * ratio),
    blurPlaceholder: await makeLqip(buffer),
    bytes,
    variants: {
      ...variants,
      fallback: fallback.url,
      thumb: thumb.url,
    },
  };
}

/** Recorte y rotacion desde el editor del panel. */
export async function transform(buffer, { rotate = 0, crop = null } = {}) {
  let pipeline = sharp(buffer).rotate();

  if (crop) {
    const { left, top, width, height } = crop;
    pipeline = pipeline.extract({
      left: Math.max(0, Math.round(left)),
      top: Math.max(0, Math.round(top)),
      width: Math.round(width),
      height: Math.round(height),
    });
  }

  if (rotate) pipeline = pipeline.rotate(rotate);

  return pipeline.jpeg({ quality: 92 }).toBuffer();
}

export default { processAndUpload, transform };
