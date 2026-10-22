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
  const base = storagePath.split('/').pop().replace(/\.[^.]+$/, '');

  const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 100 });
  if (error) throw new Error(`No se pudo listar ${folder}: ${error.message}`);

  const toRemove = (data || [])
    .filter((file) => file.name.startsWith(base))
    .map((file) => `${folder}/${file.name}`);

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
