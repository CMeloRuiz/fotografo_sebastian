import { z } from 'zod';
import supabase from '../db/supabase.js';
import { toMessage } from '../lib/mappers.js';
import { sendContactNotification } from '../services/mailer.js';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  email: z.string().trim().toLowerCase().email('Revisa el correo.'),
  phone: z.string().trim().min(7, 'Escribe un teléfono válido.').max(40),
  eventType: z.string().trim().min(1, 'Elige el tipo de evento.').max(60),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida.')
    .optional()
    .or(z.literal('')),
  message: z.string().trim().min(10, 'Cuéntame un poco más.').max(3000),
  // Campo trampa: los humanos no lo ven, los robots sí lo llenan.
  website: z.string().max(0).optional(),
});

export const statusSchema = z.object({
  status: z.enum(['nuevo', 'respondido', 'archivado']),
});

/**
 * Recibe una solicitud del formulario.
 *
 * Primero se guarda y despues se intenta el correo: si el SMTP falla, el
 * mensaje no se pierde y el fotografo lo ve igual en el panel.
 */
export async function submit(req, res) {
  const body = req.body;

  // Trampa para robots: respondemos "ok" para no darles pistas.
  if (body.website) return res.status(201).json({ ok: true });

  const { data, error } = await supabase
    .from('contact_messages')
    .insert({
      name: body.name,
      email: body.email,
      phone: body.phone,
      event_type: body.eventType,
      event_date: body.eventDate || null,
      message: body.message,
    })
    .select()
    .single();

  if (error) {
    console.error('[contacto] no se pudo guardar el mensaje:', error);
    return res.status(500).json({ error: 'No se pudo enviar el mensaje. Inténtalo de nuevo.' });
  }

  try {
    await sendContactNotification(toMessage(data));
  } catch (err) {
    console.error('[contacto] el mensaje se guardó pero el correo falló:', err.message);
  }

  return res.status(201).json({ ok: true });
}

export async function list(req, res) {
  let query = supabase.from('contact_messages').select('*').order('created_at', { ascending: false });

  if (req.query.status) query = query.eq('status', req.query.status);

  const { data, error } = await query;
  if (error) throw error;

  return res.json((data || []).map(toMessage));
}

export async function updateStatus(req, res) {
  const { data, error } = await supabase
    .from('contact_messages')
    .update({ status: req.body.status })
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Ese mensaje no existe.' });

  return res.json(toMessage(data));
}

export async function remove(req, res) {
  const { error } = await supabase.from('contact_messages').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ ok: true });
}

/** Cifras del panel de inicio. */
export async function stats(req, res) {
  const count = (table, apply) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (apply) q = apply(q);
    return q;
  };

  const [albums, published, photos, newMessages, demoPhotos] = await Promise.all([
    count('albums'),
    count('albums', (q) => q.eq('is_published', true)),
    count('photos'),
    count('contact_messages', (q) => q.eq('status', 'nuevo')),
    count('photos', (q) => q.eq('is_demo', true)),
  ]);

  const { data: latest } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  return res.json({
    albums: albums.count ?? 0,
    publishedAlbums: published.count ?? 0,
    photos: photos.count ?? 0,
    newMessages: newMessages.count ?? 0,
    demoPhotos: demoPhotos.count ?? 0,
    latestPhotos: (latest || []).map((row) => ({
      id: row.id,
      albumId: row.album_id,
      thumb: row.variants?.thumb || row.variants?.fallback || null,
      createdAt: row.created_at,
    })),
  });
}

export default { submit, list, updateStatus, remove, stats };
