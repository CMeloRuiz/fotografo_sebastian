import { z } from 'zod';
import supabase from '../db/supabase.js';
import { toPhoto } from '../lib/mappers.js';
import { processAndUpload, transform } from '../services/imagePipeline.js';
import { download, removePhotoFiles } from '../services/storage.js';

export const updatePhotoSchema = z.object({
  title: z.string().trim().max(160).optional(),
  alt: z.string().trim().max(240).optional(),
  albumId: z.string().uuid().optional(),
  isFeatured: z.boolean().optional(),
});

export const reorderPhotosSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const deleteManySchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Selecciona al menos una foto.'),
});

export const transformSchema = z
  .object({
    rotate: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).optional(),
    crop: z
      .object({
        left: z.number().min(0),
        top: z.number().min(0),
        width: z.number().positive(),
        height: z.number().positive(),
      })
      .optional(),
  })
  .refine((d) => d.rotate || d.crop, { message: 'No hay ningún cambio que aplicar.' });

/**
 * Subida multiple.
 *
 * Cada archivo se procesa por separado y el resultado se informa archivo a
 * archivo: si una foto falla, las demas se guardan igual y el panel muestra
 * exactamente cual no entro y por que.
 */
export async function upload(req, res) {
  const albumId = req.params.id;

  const { data: album } = await supabase
    .from('albums')
    .select('id, slug')
    .eq('id', albumId)
    .maybeSingle();

  if (!album) return res.status(404).json({ error: 'Ese álbum no existe.' });
  if (!req.files?.length) return res.status(400).json({ error: 'No llegó ninguna foto.' });

  const { data: last } = await supabase
    .from('photos')
    .select('sort_order')
    .eq('album_id', albumId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextOrder = (last?.sort_order ?? -1) + 1;
  const uploaded = [];
  const failed = [];

  for (const file of req.files) {
    try {
      const processed = await processAndUpload(file.buffer, file.originalname, album.slug);

      const { data, error } = await supabase
        .from('photos')
        .insert({
          album_id: albumId,
          storage_path: processed.storagePath,
          variants: processed.variants,
          width: processed.width,
          height: processed.height,
          blur_placeholder: processed.blurPlaceholder,
          bytes: processed.bytes,
          alt: '',
          sort_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      nextOrder += 1;
      uploaded.push(toPhoto(data));
    } catch (err) {
      console.error('[photos] falló la subida de', file.originalname, err);
      failed.push({ file: file.originalname, error: err.message });
    }
  }

  // La primera foto que entra al album se vuelve la portada por defecto.
  if (uploaded.length) {
    const { data: current } = await supabase
      .from('albums')
      .select('cover_photo_id')
      .eq('id', albumId)
      .maybeSingle();

    if (!current?.cover_photo_id) {
      await supabase
        .from('albums')
        .update({ cover_photo_id: uploaded[0].id })
        .eq('id', albumId);
    }
  }

  return res.status(uploaded.length ? 201 : 400).json({ uploaded, failed });
}

export async function update(req, res) {
  const patch = {};
  if (req.body.title !== undefined) patch.title = req.body.title;
  if (req.body.alt !== undefined) patch.alt = req.body.alt;
  if (req.body.albumId !== undefined) patch.album_id = req.body.albumId;
  if (req.body.isFeatured !== undefined) patch.is_featured = req.body.isFeatured;

  const { data, error } = await supabase
    .from('photos')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Esa foto no existe.' });

  return res.json(toPhoto(data));
}

/** Marca esta foto como portada de su álbum. */
export async function setCover(req, res) {
  const { data: photo } = await supabase
    .from('photos')
    .select('id, album_id')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!photo) return res.status(404).json({ error: 'Esa foto no existe.' });

  const { error } = await supabase
    .from('albums')
    .update({ cover_photo_id: photo.id })
    .eq('id', photo.album_id);

  if (error) throw error;
  return res.json({ ok: true });
}

/**
 * Rota o recorta una foto ya subida.
 *
 * Parte de la variante mas grande que hay en el storage: el archivo original
 * no se conserva, para no gastar la cuota con imagenes de 20 MB que el sitio
 * nunca sirve. Para web es de sobra, pero significa que recortar varias
 * veces seguidas va perdiendo algo de calidad.
 */
export async function applyTransform(req, res) {
  const { data: photo } = await supabase
    .from('photos')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!photo) return res.status(404).json({ error: 'Esa foto no existe.' });

  const { data: album } = await supabase
    .from('albums')
    .select('slug')
    .eq('id', photo.album_id)
    .maybeSingle();

  const source = await download(photo.storage_path);
  const edited = await transform(source, req.body);
  const processed = await processAndUpload(edited, 'editada', album.slug);

  const { data: updated, error } = await supabase
    .from('photos')
    .update({
      storage_path: processed.storagePath,
      variants: processed.variants,
      width: processed.width,
      height: processed.height,
      blur_placeholder: processed.blurPlaceholder,
      bytes: processed.bytes,
    })
    .eq('id', photo.id)
    .select()
    .single();

  if (error) throw error;

  // Los archivos viejos se borran al final: si algo falla antes, la foto
  // anterior sigue intacta y no queda un album roto.
  try {
    await removePhotoFiles(photo.storage_path);
  } catch (err) {
    console.error('[photos] quedaron archivos sin borrar:', photo.storage_path, err.message);
  }

  return res.json(toPhoto(updated));
}

async function deletePhotos(ids) {
  const { data: photos } = await supabase
    .from('photos')
    .select('id, storage_path')
    .in('id', ids);

  for (const photo of photos || []) {
    try {
      await removePhotoFiles(photo.storage_path);
    } catch (err) {
      console.error('[photos] no se pudo borrar del storage:', photo.storage_path, err.message);
    }
  }

  const { error } = await supabase.from('photos').delete().in('id', ids);
  if (error) throw error;

  return photos?.length || 0;
}

export async function remove(req, res) {
  const deleted = await deletePhotos([req.params.id]);
  if (!deleted) return res.status(404).json({ error: 'Esa foto no existe.' });
  return res.json({ ok: true });
}

export async function removeMany(req, res) {
  const deleted = await deletePhotos(req.body.ids);
  return res.json({ ok: true, deleted });
}

export async function reorder(req, res) {
  const updates = req.body.ids.map((id, index) =>
    supabase.from('photos').update({ sort_order: index }).eq('id', id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;

  return res.json({ ok: true });
}

export default { upload, update, setCover, remove, removeMany, reorder, applyTransform };
