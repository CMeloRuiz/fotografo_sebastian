import { z } from 'zod';
import supabase from '../db/supabase.js';
import { toAlbum } from '../lib/mappers.js';
import { removePhotoFiles } from '../services/storage.js';

/** Convierte un titulo en un slug limpio para la URL del album. */
export function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const base = {
  title: z.string().trim().min(2, 'El título es obligatorio.').max(120),
  category: z.string().trim().min(1, 'Elige una categoría.'),
  eventDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida.').nullish().or(z.literal('')),
  description: z.string().trim().max(600).optional().default(''),
  isPublished: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
};

export const createAlbumSchema = z.object(base);
export const updateAlbumSchema = z.object({
  ...base,
  title: base.title.optional(),
  category: base.category.optional(),
  coverPhotoId: z.string().uuid().nullish(),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'No hay nada que reordenar.'),
});

/** Todos los albumes, publicados o no: esta es la vista del panel. */
export async function list(req, res) {
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  if (!albums.length) return res.json([]);

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .in('album_id', albums.map((a) => a.id))
    .order('sort_order');

  const byAlbum = new Map();
  for (const photo of photos || []) {
    if (!byAlbum.has(photo.album_id)) byAlbum.set(photo.album_id, []);
    byAlbum.get(photo.album_id).push(photo);
  }

  return res.json(albums.map((a) => toAlbum(a, byAlbum.get(a.id) || [])));
}

export async function getOne(req, res) {
  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) throw error;
  if (!album) return res.status(404).json({ error: 'Ese álbum no existe.' });

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('album_id', album.id)
    .order('sort_order');

  return res.json(toAlbum(album, photos || []));
}

/** Busca un slug libre anadiendo -2, -3... si hace falta. */
async function uniqueSlug(title, excludeId = null) {
  const root = slugify(title) || 'album';
  let candidate = root;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = supabase.from('albums').select('id').eq('slug', candidate);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
}

export async function create(req, res) {
  const body = req.body;

  const { data: last } = await supabase
    .from('albums')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('albums')
    .insert({
      title: body.title,
      slug: await uniqueSlug(body.title),
      category: body.category,
      event_date: body.eventDate || null,
      description: body.description || '',
      is_published: body.isPublished,
      is_featured: body.isFeatured,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) throw error;
  return res.status(201).json(toAlbum(data, []));
}

export async function update(req, res) {
  const body = req.body;
  const patch = {};

  if (body.title !== undefined) {
    patch.title = body.title;
    patch.slug = await uniqueSlug(body.title, req.params.id);
  }
  if (body.category !== undefined) patch.category = body.category;
  if (body.eventDate !== undefined) patch.event_date = body.eventDate || null;
  if (body.description !== undefined) patch.description = body.description;
  if (body.isPublished !== undefined) patch.is_published = body.isPublished;
  if (body.isFeatured !== undefined) patch.is_featured = body.isFeatured;
  if (body.coverPhotoId !== undefined) patch.cover_photo_id = body.coverPhotoId || null;

  const { data, error } = await supabase
    .from('albums')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Ese álbum no existe.' });

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('album_id', data.id)
    .order('sort_order');

  return res.json(toAlbum(data, photos || []));
}

/**
 * Borra el album y, antes, todos los archivos de sus fotos.
 * El borrado en cascada de Postgres limpia las filas, pero el storage se
 * quedaria con archivos huerfanos ocupando cuota para siempre.
 */
export async function remove(req, res) {
  const { data: photos } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('album_id', req.params.id);

  for (const photo of photos || []) {
    try {
      await removePhotoFiles(photo.storage_path);
    } catch (err) {
      console.error('[albums] no se pudo borrar del storage:', photo.storage_path, err.message);
    }
  }

  const { error } = await supabase.from('albums').delete().eq('id', req.params.id);
  if (error) throw error;

  return res.json({ ok: true, deletedPhotos: photos?.length || 0 });
}

/** Guarda el nuevo orden tras arrastrar y soltar en el panel. */
export async function reorder(req, res) {
  const { ids } = req.body;

  const updates = ids.map((id, index) =>
    supabase.from('albums').update({ sort_order: index }).eq('id', id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;

  return res.json({ ok: true });
}

export default { list, getOne, create, update, remove, reorder };
