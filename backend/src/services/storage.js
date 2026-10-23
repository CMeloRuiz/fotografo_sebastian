import supabase from '../db/supabase.js';
import config from '../config/env.js';

/**
 * Capa de almacenamiento.
 *
 * Todo el resto del backend habla con este modulo, nunca con Supabase
 * Storage directamente. Si algun dia conviene pasarse a Cloudinary o a S3,
 * se reescribe este archivo y nada mas.
 */

const BUCKET = config.supabase.bucket;

/** Sube un buffer y devuelve la ruta y la URL publica. */
export async function upload(path, buffer, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    // Un ano: las rutas llevan un id unico, asi que el archivo nunca cambia.
    cacheControl: '31536000',
    upsert: true,
  });

  if (error) throw new Error(`No se pudo subir ${path}: ${error.message}`);

  return { path, url: publicUrl(path) };
}

/** Descarga un archivo del bucket como Buffer. */
export async function download(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw new Error(`No se pudo descargar ${path}: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

export function publicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Borra varios archivos. Tolera que alguno ya no exista. */
export async function removeMany(paths) {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(`No se pudieron borrar los archivos: ${error.message}`);
}

/**
 * Borra todos los archivos derivados de una foto.
 * Las variantes comparten prefijo, asi que se listan y se eliminan juntas.
 */
export async function removePhotoFiles(storagePath) {
  const folder = storagePath.split('/').slice(0, -1).join('/');

  /*
   * storage_path apunta al JPEG mas grande: <base>-<ancho>.jpg. Las demas
   * variantes son <base>-<ancho>.avif/.webp y <base>-thumb.webp, asi que
   * hay que quitar tambien el sufijo del ancho, no solo la extension.
   *
   * Quitando solo la extension, el prefijo se quedaba en "<base>-1920" y
   * unicamente borraba las tres variantes de 1920: las otras nueve se
   * quedaban en el bucket para siempre, ocupando cuota invisible.
   */
  const base = storagePath.split('/').pop().replace(/-[^-]+\.[^.]+$/, '');

  /*
   * list() devuelve como mucho 100 entradas por llamada y cada foto deja
   * doce archivos, asi que a partir del noveno album la primera pagina ya
   * no alcanza. Recorremos hasta agotar la carpeta.
   */
  const PAGINA = 100;
  const toRemove = [];

  for (let offset = 0; ; offset += PAGINA) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: PAGINA, offset });

    if (error) throw new Error(`No se pudo listar ${folder}: ${error.message}`);
    if (!data?.length) break;

    for (const file of data) {
      // El guion final evita que "foto-ab12" arrastre a "foto-ab12x"
      if (file.name.startsWith(`${base}-`)) toRemove.push(`${folder}/${file.name}`);
    }

    if (data.length < PAGINA) break;
  }

  await removeMany(toRemove);
  return toRemove.length;
}

/** Crea el bucket si no existe. Se llama una vez al arrancar. */
export async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: config.uploads.maxFileBytes,
  });

  // Si otro proceso lo creo primero, no es un fallo
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`No se pudo crear el bucket "${BUCKET}": ${error.message}`);
  }
}

export default { upload, download, publicUrl, removeMany, removePhotoFiles, ensureBucket };
