/**
 * Carga inicial de la base de datos.
 *
 * Toma el contenido del sitio del mismo archivo que usa el frontend
 * (frontend/src/data/siteContent.js), para que no existan dos copias del
 * texto que se puedan desincronizar.
 *
 * REGLA CRITICA: este script no inserta ninguna foto de clientes. Los
 * albumes de ejemplo se cargan solo si existe el manifiesto que genera la
 * Fase 4 con las imagenes creadas con IA, y quedan marcados is_demo = true.
 *
 *   npm run seed
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

import supabase from '../src/db/supabase.js';
import { siteContent } from '../../frontend/src/data/siteContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_MANIFEST = path.join(__dirname, 'demo-albums.json');

const log = (...args) => console.log(' ', ...args);

/** Claves de site_content: todo lo editable menos services y testimonials,
 *  que viven en sus propias tablas. */
const CONTENT_KEYS = [
  'identity',
  'hero',
  'about',
  'stats',
  'categories',
  'process',
  'whyMe',
  'contact',
  'social',
  'footer',
  'eventTypes',
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    log('ADMIN_EMAIL / ADMIN_PASSWORD sin definir: se omite el administrador.');
    return;
  }
  if (password.length < 10) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 10 caracteres.');
  }

  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existing) {
    log(`administrador ${email} ya existe, no se toca`);
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const { error } = await supabase
    .from('admins')
    .insert({ email: email.toLowerCase(), password_hash, name: siteContent.identity.name });

  if (error) throw error;
  log(`administrador creado: ${email}`);
}

async function seedContent() {
  const rows = CONTENT_KEYS.filter((key) => siteContent[key] !== undefined).map((key) => ({
    key,
    value: siteContent[key],
  }));

  const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
  log(`${rows.length} claves de contenido cargadas`);
}

async function seedServices() {
  const rows = siteContent.services.map((service, i) => ({
    slug: service.slug,
    title: service.title,
    description: service.description,
    features: service.features,
    price_label: service.priceLabel,
    image_key: service.image,
    sort_order: i,
    is_published: true,
  }));

  const { error } = await supabase.from('services').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;
  log(`${rows.length} servicios cargados`);
}

async function seedTestimonials() {
  const { count } = await supabase
    .from('testimonials')
    .select('*', { count: 'exact', head: true });

  if (count > 0) {
    log(`ya hay ${count} testimonios, no se insertan los de ejemplo`);
    return;
  }

  const rows = siteContent.testimonials.map((t, i) => ({
    author: t.author,
    event_type: t.eventType,
    text: t.text,
    is_published: true,
    is_demo: true,
    sort_order: i,
  }));

  const { error } = await supabase.from('testimonials').insert(rows);
  if (error) throw error;
  log(`${rows.length} testimonios de ejemplo cargados (marcados is_demo)`);
}

/**
 * Albumes de demostracion generados con IA (Fase 4).
 * Sin el manifiesto, simplemente no hay albumes: preferimos un portafolio
 * vacio con su mensaje antes que inventar contenido.
 */
async function seedDemoAlbums() {
  if (!fs.existsSync(DEMO_MANIFEST)) {
    log('sin demo-albums.json: no se cargan álbumes de ejemplo todavía');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(DEMO_MANIFEST, 'utf8'));

  for (const [i, album] of manifest.entries()) {
    const { data: existing } = await supabase
      .from('albums')
      .select('id')
      .eq('slug', album.slug)
      .maybeSingle();

    if (existing) {
      log(`álbum ${album.slug} ya existe, se omite`);
      continue;
    }

    const { data: created, error } = await supabase
      .from('albums')
      .insert({
        title: album.title,
        slug: album.slug,
        category: album.category,
        event_date: album.eventDate || null,
        description: album.description || '',
        is_published: true,
        is_featured: album.isFeatured ?? i < 4,
        is_demo: true,
        sort_order: i,
      })
      .select()
      .single();

    if (error) throw error;

    const photoRows = album.photos.map((photo, j) => ({
      album_id: created.id,
      storage_path: photo.storagePath,
      variants: photo.variants,
      width: photo.width,
      height: photo.height,
      blur_placeholder: photo.blurPlaceholder,
      bytes: photo.bytes ?? null,
      alt: photo.alt || '',
      is_demo: true,
      sort_order: j,
    }));

    const { data: insertedPhotos, error: photoError } = await supabase
      .from('photos')
      .insert(photoRows)
      .select();

    if (photoError) throw photoError;

    await supabase
      .from('albums')
      .update({ cover_photo_id: insertedPhotos[0].id })
      .eq('id', created.id);

    log(`álbum de ejemplo "${album.title}" con ${insertedPhotos.length} fotos`);
  }
}

(async () => {
  console.log('Cargando datos iniciales...');
  await seedAdmin();
  await seedContent();
  await seedServices();
  await seedTestimonials();
  await seedDemoAlbums();
  console.log('Listo.');
  process.exit(0);
})().catch((err) => {
  console.error('Falló la carga inicial:', err.message);
  process.exit(1);
});
