import { z } from 'zod';
import supabase from '../db/supabase.js';
import { toService, toTestimonial } from '../lib/mappers.js';
import { processAndUpload } from '../services/imagePipeline.js';

/**
 * Contenido editable: textos del sitio, testimonios y servicios.
 *
 * site_content es clave/valor en JSON a proposito: agregar un texto nuevo al
 * sitio no obliga a migrar la base de datos.
 */

export const contentSchema = z.object({
  key: z.string().trim().min(1).max(60),
  value: z.unknown(),
});

export const testimonialSchema = z.object({
  author: z.string().trim().min(2, 'Escribe el nombre del cliente.').max(120),
  eventType: z.string().trim().max(60).optional().default(''),
  text: z.string().trim().min(10, 'El testimonio es muy corto.').max(900),
  isPublished: z.boolean().optional().default(true),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional().default(''),
  features: z.array(z.string().trim().min(1).max(120)).max(12).optional().default([]),
  priceLabel: z.string().trim().max(60).optional().default('Cotizar'),
  image: z.string().trim().max(60).optional(),
  isPublished: z.boolean().optional().default(true),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

/** Vista del panel: todo, publicado o no. */
export async function getAll(req, res) {
  const [content, services, testimonials] = await Promise.all([
    supabase.from('site_content').select('key, value'),
    supabase.from('services').select('*').order('sort_order'),
    supabase.from('testimonials').select('*').order('sort_order'),
  ]);

  if (content.error) throw content.error;

  return res.json({
    content: Object.fromEntries((content.data || []).map((r) => [r.key, r.value])),
    services: (services.data || []).map(toService),
    testimonials: (testimonials.data || []).map(toTestimonial),
  });
}

/** Guarda (o crea) una clave de contenido. */
export async function setContent(req, res) {
  const { key, value } = req.body;

  const { error } = await supabase
    .from('site_content')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) throw error;
  return res.json({ ok: true, key });
}

/**
 * Imagenes del propio sitio: el fondo del hero y la foto de "Sobre mi".
 *
 * Pasan por el mismo pipeline que las fotos de los albumes, asi que el hero
 * que cambie el fotografo desde el celular sale igual de optimizado que el
 * que dejamos nosotros. Se guarda como una clave mas de site_content.
 */
const MEDIA_KEYS = ['heroMedia', 'aboutPhoto'];

export async function uploadMedia(req, res) {
  const { key } = req.params;

  if (!MEDIA_KEYS.includes(key)) {
    return res.status(400).json({ error: `Imagen no reconocida: ${key}` });
  }
  if (!req.files?.length) {
    return res.status(400).json({ error: 'No llegó ninguna imagen.' });
  }

  const file = req.files[0];
  const processed = await processAndUpload(file.buffer, key, 'sitio');

  const value = {
    width: processed.width,
    height: processed.height,
    lqip: processed.blurPlaceholder,
    fallback: processed.variants.fallback,
    avif: processed.variants.avif,
    webp: processed.variants.webp,
    storagePath: processed.storagePath,
  };

  const { error } = await supabase.from('site_content').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;

  return res.status(201).json({ key, value });
}

// ── Testimonios ──────────────────────────────────────────────

export async function createTestimonial(req, res) {
  const { data: last } = await supabase
    .from('testimonials')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('testimonials')
    .insert({
      author: req.body.author,
      event_type: req.body.eventType,
      text: req.body.text,
      is_published: req.body.isPublished,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) throw error;
  return res.status(201).json(toTestimonial(data));
}

export async function updateTestimonial(req, res) {
  const patch = {};
  if (req.body.author !== undefined) patch.author = req.body.author;
  if (req.body.eventType !== undefined) patch.event_type = req.body.eventType;
  if (req.body.text !== undefined) patch.text = req.body.text;
  if (req.body.isPublished !== undefined) patch.is_published = req.body.isPublished;
  // Si el fotografo lo edita, deja de ser contenido de ejemplo.
  patch.is_demo = false;

  const { data, error } = await supabase
    .from('testimonials')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Ese testimonio no existe.' });

  return res.json(toTestimonial(data));
}

export async function deleteTestimonial(req, res) {
  const { error } = await supabase.from('testimonials').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ ok: true });
}

// ── Servicios ────────────────────────────────────────────────

export async function updateService(req, res) {
  const patch = {};
  if (req.body.title !== undefined) patch.title = req.body.title;
  if (req.body.description !== undefined) patch.description = req.body.description;
  if (req.body.features !== undefined) patch.features = req.body.features;
  if (req.body.priceLabel !== undefined) patch.price_label = req.body.priceLabel;
  if (req.body.image !== undefined) patch.image_key = req.body.image;
  if (req.body.isPublished !== undefined) patch.is_published = req.body.isPublished;

  const { data, error } = await supabase
    .from('services')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Ese servicio no existe.' });

  return res.json(toService(data));
}

export async function reorderTestimonials(req, res) {
  const results = await Promise.all(
    req.body.ids.map((id, i) =>
      supabase.from('testimonials').update({ sort_order: i }).eq('id', id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
  return res.json({ ok: true });
}

export default {
  getAll,
  setContent,
  uploadMedia,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  updateService,
  reorderTestimonials,
};
