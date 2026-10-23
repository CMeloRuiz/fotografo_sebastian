import supabase from '../db/supabase.js';
import { toAlbum, toService, toTestimonial } from '../lib/mappers.js';

/**
 * API publica: solo lectura y cacheable.
 *
 * Nada de lo que sale por aqui necesita sesion, asi que se le pone
 * Cache-Control y el CDN o el navegador puede reutilizarlo.
 */

/*
 * max-age=0 obliga al navegador a revalidar en cada visita. No es caro:
 * Express manda ETag y la respuesta repetida se resuelve con un 304 vacio.
 *
 * Antes era max-age=60, y eso rompia lo primero que hace el fotografo al
 * publicar un album: abrir el sitio para verlo. Durante el minuto siguiente
 * su navegador le seguia dando la respuesta vieja y el album no aparecia,
 * que desde su lado se ve exactamente igual que si no hubiera funcionado.
 *
 * s-maxage sigue dejando que un CDN o un proxy cachee un minuto, que es
 * donde el cache de verdad importa cuando hay visitas.
 */
const PUBLIC_CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=600';

function fail(res, error, what) {
  console.error(`[public] fallo al leer ${what}:`, error);
  return res.status(502).json({ error: 'No se pudo leer el contenido del sitio.' });
}

/** Todo el contenido editable del sitio, en la forma que espera el frontend. */
export async function getContent(req, res) {
  const [content, services, testimonials] = await Promise.all([
    supabase.from('site_content').select('key, value'),
    supabase.from('services').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('testimonials').select('*').eq('is_published', true).order('sort_order'),
  ]);

  if (content.error) return fail(res, content.error, 'site_content');
  if (services.error) return fail(res, services.error, 'services');
  if (testimonials.error) return fail(res, testimonials.error, 'testimonials');

  const payload = Object.fromEntries((content.data || []).map((row) => [row.key, row.value]));
  payload.services = (services.data || []).map(toService);
  payload.testimonials = (testimonials.data || []).map(toTestimonial);

  res.set('Cache-Control', PUBLIC_CACHE);
  return res.json(payload);
}

/** Albumes publicados con sus fotos. */
export async function listAlbums(req, res) {
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
    .order('event_date', { ascending: false });

  if (error) return fail(res, error, 'albums');
  if (!albums?.length) {
    res.set('Cache-Control', PUBLIC_CACHE);
    return res.json([]);
  }

  // Una sola consulta para las fotos de todos los albumes, no una por album
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .in('album_id', albums.map((a) => a.id))
    .order('sort_order');

  if (photosError) return fail(res, photosError, 'photos');

  const byAlbum = new Map();
  for (const photo of photos || []) {
    if (!byAlbum.has(photo.album_id)) byAlbum.set(photo.album_id, []);
    byAlbum.get(photo.album_id).push(photo);
  }

  res.set('Cache-Control', PUBLIC_CACHE);
  return res.json(albums.map((album) => toAlbum(album, byAlbum.get(album.id) || [])));
}

/** Un album por slug. */
export async function getAlbum(req, res) {
  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('slug', req.params.slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error) return fail(res, error, 'album');
  if (!album) return res.status(404).json({ error: 'Ese álbum no existe.' });

  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('album_id', album.id)
    .order('sort_order');

  if (photosError) return fail(res, photosError, 'photos');

  res.set('Cache-Control', PUBLIC_CACHE);
  return res.json(toAlbum(album, photos || []));
}

export default { getContent, listAlbums, getAlbum };
