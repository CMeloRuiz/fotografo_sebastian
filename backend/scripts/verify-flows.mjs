/**
 * Verificacion de extremo a extremo de los flujos que escriben datos.
 *
 * Ejercita la API real por HTTP, pasando por la sesion, la validacion, multer
 * y el pipeline de imagenes, contra un Supabase real. Crea un administrador
 * desechable y un album de prueba, y los borra al terminar, pase lo que pase.
 *
 *   npm run verify                                  # backend en localhost:4000
 *   API=https://mi-api.onrender.com npm run verify  # contra el desplegado
 *
 * No imprime nunca la service_role key ni la contrasena que genera.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { randomUUID, randomBytes } from 'node:crypto';

const API = (process.env.API || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '');
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'photos';

if (!process.env.SUPABASE_URL || /placeholder/.test(process.env.SUPABASE_URL)) {
  console.error('\n  Falta SUPABASE_URL en backend/.env (sigue con el valor de relleno).\n');
  process.exit(1);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n  Falta SUPABASE_SERVICE_ROLE_KEY en backend/.env.\n');
  process.exit(1);
}

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Mini runner ──────────────────────────────────────────────
const results = [];
let cookie = '';

async function step(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true });
    console.log(`  ok    ${name}${detail ? `  — ${detail}` : ''}`);
  } catch (err) {
    results.push({ name, ok: false, detail: err.message });
    console.log(`  FALLA ${name}\n          ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function api(path, { method = 'GET', body, form, expect = 200 } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (body) headers['content-type'] = 'application/json';

  const res = await fetch(`${API}/api${path}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }

  if (expect && res.status !== expect) {
    throw new Error(
      `${method} ${path} devolvio ${res.status}, se esperaba ${expect}: ${JSON.stringify(json).slice(0, 220)}`,
    );
  }
  return json;
}

/**
 * JPEG de prueba con EXIF, para comprobar que el pipeline lo elimina.
 * 1920 de ancho para que se generen las cinco variantes.
 */
const MARCA_EXIF = 'ESTE-EXIF-NO-DEBE-SOBREVIVIR';

function testJpeg(i) {
  return sharp({
    create: {
      width: 1920,
      height: 1280,
      channels: 3,
      background: { r: 30, g: 60 + (i * 40) % 150, b: 40 },
    },
  })
    .jpeg({ quality: 88 })
    .withExif({ IFD0: { Copyright: MARCA_EXIF, Artist: MARCA_EXIF, Software: 'verify-flows' } })
    .toBuffer();
}

/** Lista los archivos de la carpeta de un album. */
async function listarCarpeta(storagePath) {
  const carpeta = storagePath.split('/').slice(0, -1).join('/');
  const { data, error } = await db.storage.from(BUCKET).list(carpeta, { limit: 200 });
  if (error) throw new Error(`no se pudo listar ${carpeta}: ${error.message}`);
  return { carpeta, nombres: (data || []).map((f) => f.name) };
}

// ── Estado compartido ────────────────────────────────────────
const suffix = randomBytes(3).toString('hex');
const adminEmail = `verificacion-${suffix}@prueba.local`;
const adminPassword = randomBytes(18).toString('base64url');
const correoPrueba = `prueba-${suffix}@ejemplo.com`;

let adminId = null;
let albumId = null;
let albumSlug = null;
let photoIds = [];
let rutaEjemplo = null;
let messageId = null;

console.log(`\nVerificando ${API}\n`);

try {
  // ── 0. Preparacion ─────────────────────────────────────────
  await step('El backend responde', async () => {
    const r = await api('/health');
    assert(r.ok === true, 'health no devolvio ok');
    return r.at;
  });

  await step('Las tablas del esquema existen', async () => {
    const tablas = ['albums', 'photos', 'site_content', 'services', 'testimonials', 'contact_messages', 'admins'];
    for (const t of tablas) {
      const { error } = await db.from(t).select('*', { count: 'exact', head: true });
      assert(!error, `la tabla "${t}" no responde: ${error?.message}`);
    }
    return `${tablas.length} tablas`;
  });

  await step('El bucket de storage existe y es publico', async () => {
    const { data, error } = await db.storage.getBucket(BUCKET);
    assert(!error, `no se encontro el bucket "${BUCKET}": ${error?.message}`);
    assert(data.public, `el bucket "${BUCKET}" no es publico; las fotos no se verian en el sitio`);
    return BUCKET;
  });

  await step('Se crea un administrador desechable', async () => {
    adminId = randomUUID();
    const { error } = await db.from('admins').insert({
      id: adminId,
      email: adminEmail,
      password_hash: await bcrypt.hash(adminPassword, 10),
      name: 'Verificacion automatica',
    });
    assert(!error, error?.message);
    return adminEmail;
  });

  // ── 1. Sesion ──────────────────────────────────────────────
  await step('Login con credenciales correctas', async () => {
    const r = await api('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPassword },
    });
    assert(r.admin?.email === adminEmail, 'el login no devolvio el usuario');
    assert(cookie.startsWith('ss_session='), `la cookie de sesion no es la esperada: ${cookie.split('=')[0]}`);
    return 'cookie recibida';
  });

  await step('Login con contrasena incorrecta es rechazado', async () => {
    const guardada = cookie;
    cookie = '';
    await api('/auth/login', {
      method: 'POST',
      expect: 401,
      body: { email: adminEmail, password: 'definitivamente-incorrecta' },
    });
    cookie = guardada;
    return '401 como se espera';
  });

  await step('La sesion se reconoce en /auth/me', async () => {
    const r = await api('/auth/me');
    assert(r.admin?.id === adminId, 'devolvio otro usuario');
    return r.admin.email;
  });

  await step('Sin cookie, el panel responde 401', async () => {
    const guardada = cookie;
    cookie = '';
    await api('/admin/albums', { expect: 401 });
    cookie = guardada;
    return 'protegido';
  });

  // ── 2. Albumes ─────────────────────────────────────────────
  await step('Crear album', async () => {
    const album = await api('/admin/albums', {
      method: 'POST',
      expect: 201,
      body: {
        title: `Verificacion ${suffix}`,
        category: 'matrimonios',
        eventDate: '2026-03-14',
        description: 'Album temporal del script de verificacion.',
        isPublished: false,
        isFeatured: false,
      },
    });
    albumId = album.id;
    albumSlug = album.slug;
    assert(albumId, `la respuesta no trae id: ${JSON.stringify(album).slice(0, 200)}`);
    assert(albumSlug, 'la respuesta no trae slug');
    return `slug ${albumSlug}`;
  });

  await step('Crear album sin titulo es rechazado', async () => {
    await api('/admin/albums', {
      method: 'POST',
      expect: 400,
      body: { title: '', category: 'matrimonios' },
    });
    return '400 como se espera';
  });

  // ── 3. Subida de fotos ─────────────────────────────────────
  await step('Subir 3 fotos', async () => {
    const form = new FormData();
    for (let i = 0; i < 3; i += 1) {
      const buf = await testJpeg(i);
      form.append('photos', new Blob([buf], { type: 'image/jpeg' }), `prueba-${i}.jpg`);
    }
    const r = await api(`/admin/albums/${albumId}/photos`, { method: 'POST', form, expect: 201 });
    assert(!r.failed?.length, `fallaron: ${JSON.stringify(r.failed)}`);
    assert(r.uploaded?.length === 3, `se subieron ${r.uploaded?.length} de 3`);

    const p = r.uploaded[0];
    assert(p.avif?.length === 5, `la respuesta trae ${p.avif?.length} variantes AVIF, se esperaban 5`);
    assert(p.webp?.length === 5, `la respuesta trae ${p.webp?.length} variantes WebP, se esperaban 5`);
    assert(p.lqip?.startsWith('data:'), 'falta el placeholder borroso');
    assert(p.width === 1920 && p.height === 1280, `dimensiones ${p.width}x${p.height}, se esperaba 1920x1280`);

    photoIds = r.uploaded.map((x) => x.id);
    return '3 de 3, con sus 5 anchos';
  });

  await step('Los archivos quedaron en el storage', async () => {
    const { data, error } = await db
      .from('photos')
      .select('storage_path, blur_placeholder, width, height')
      .eq('album_id', albumId);
    assert(!error, error?.message);
    assert(data.length === 3, `hay ${data.length} filas, se esperaban 3`);
    rutaEjemplo = data[0].storage_path;

    const { carpeta, nombres } = await listarCarpeta(rutaEjemplo);
    const avif = nombres.filter((n) => n.endsWith('.avif')).length;
    const webp = nombres.filter((n) => n.endsWith('.webp')).length;
    const jpg = nombres.filter((n) => n.endsWith('.jpg')).length;
    const thumbs = nombres.filter((n) => n.includes('-thumb.')).length;

    assert(avif === 15, `${avif} archivos AVIF, se esperaban 15 (3 fotos x 5 anchos)`);
    assert(webp === 18, `${webp} archivos WebP, se esperaban 18 (15 variantes + 3 miniaturas)`);
    assert(jpg === 3, `${jpg} JPEG de respaldo, se esperaban 3`);
    assert(thumbs === 3, `${thumbs} miniaturas, se esperaban 3`);
    return `${nombres.length} archivos en ${carpeta}`;
  });

  await step('Los metadatos EXIF se eliminaron', async () => {
    const { data: blob, error } = await db.storage.from(BUCKET).download(rutaEjemplo);
    assert(!error, error?.message);

    const buf = Buffer.from(await blob.arrayBuffer());
    const meta = await sharp(buf).metadata();
    assert(!meta.exif, 'la imagen publicada todavia lleva un bloque EXIF');
    assert(!buf.toString('latin1').includes(MARCA_EXIF), 'el EXIF original sobrevivio dentro del archivo');
    return 'sin EXIF: tampoco hay GPS';
  });

  // ── 4. Manipulacion de fotos ───────────────────────────────
  await step('Reordenar fotos', async () => {
    const invertido = [...photoIds].reverse();
    await api('/admin/photos/reorder', { method: 'PUT', body: { ids: invertido } });

    const { data } = await db
      .from('photos')
      .select('id, sort_order')
      .eq('album_id', albumId)
      .order('sort_order');
    assert(data.map((p) => p.id).join() === invertido.join(), 'el orden no se guardo');
    return 'orden invertido y persistido';
  });

  await step('Elegir portada', async () => {
    const elegida = photoIds[1];
    await api(`/admin/photos/${elegida}/cover`, { method: 'POST' });
    const { data } = await db.from('albums').select('cover_photo_id').eq('id', albumId).single();
    assert(data.cover_photo_id === elegida, 'la portada no cambio');
    return 'portada actualizada';
  });

  await step('Editar titulo y texto alternativo de una foto', async () => {
    await api(`/admin/photos/${photoIds[0]}`, {
      method: 'PATCH',
      body: { title: 'Titulo de prueba', alt: 'Texto alternativo de prueba' },
    });
    const { data } = await db.from('photos').select('title, alt').eq('id', photoIds[0]).single();
    assert(data.title === 'Titulo de prueba', 'no se guardo el titulo');
    assert(data.alt === 'Texto alternativo de prueba', 'no se guardo el texto alternativo');
    return 'guardado';
  });

  await step('Girar una foto regenera sus variantes', async () => {
    const { data: antes } = await db.from('photos').select('width, height').eq('id', photoIds[0]).single();
    await api(`/admin/photos/${photoIds[0]}/transform`, { method: 'POST', body: { rotate: 90 } });
    const { data: despues } = await db.from('photos').select('width, height').eq('id', photoIds[0]).single();

    /*
     * No se comparan pixeles exactos a proposito. El pipeline guarda las
     * dimensiones de la variante mas grande que genera, no las del original,
     * y al girar una foto apaisada la mas grande baja de escalon: 1920x1280
     * acaba en 1200x1800, no en 1280x1920. Lo que tiene que conservarse es
     * la proporcion invertida, que es de lo que depende el hueco reservado
     * en la pagina.
     */
    const ratioAntes = antes.width / antes.height;
    const ratioDespues = despues.width / despues.height;

    assert(
      Math.abs(ratioDespues - 1 / ratioAntes) < 0.02,
      `la proporcion no se invirtio: ${ratioAntes.toFixed(3)} -> ${ratioDespues.toFixed(3)}`,
    );
    return `${antes.width}x${antes.height} -> ${despues.width}x${despues.height}, proporcion invertida`;
  });

  // ── 5. Publicacion y API publica ───────────────────────────
  await step('El album en borrador NO aparece en la API publica', async () => {
    const lista = await api('/albums');
    assert(Array.isArray(lista), 'la API publica no devolvio una lista');
    assert(!lista.some((a) => a.id === albumId), 'un borrador se esta publicando');
    return 'oculto';
  });

  await step('Publicar el album', async () => {
    await api(`/admin/albums/${albumId}`, {
      method: 'PATCH',
      body: { isPublished: true, isFeatured: true },
    });
    const { data } = await db.from('albums').select('is_published, is_featured').eq('id', albumId).single();
    assert(data.is_published, 'no se publico');
    assert(data.is_featured, 'no quedo destacado');
    return 'publicado y destacado';
  });

  await step('Ya aparece en la API publica con sus fotos', async () => {
    const album = await api(`/albums/${albumSlug}`);
    assert(album.photos?.length === 3, `devolvio ${album.photos?.length} fotos`);
    assert(album.photos[0].avif?.length > 0, 'las fotos no traen las variantes AVIF');
    assert(album.photos[0].lqip, 'las fotos no traen el placeholder');
    return '3 fotos con variantes y placeholder';
  });

  await step('Reordenar albumes', async () => {
    const { data } = await db.from('albums').select('id').order('sort_order');
    const ids = data.map((a) => a.id);
    await api('/admin/albums/reorder', { method: 'PUT', body: { ids: [...ids].reverse() } });
    return `${ids.length} albumes`;
  });

  // ── 6. Formulario de contacto ──────────────────────────────
  await step('Enviar el formulario de contacto', async () => {
    const guardada = cookie;
    cookie = '';
    await api('/contact', {
      method: 'POST',
      expect: 201,
      body: {
        name: 'Prueba Automatica',
        email: correoPrueba,
        phone: '3001234567',
        eventType: 'Matrimonio',
        eventDate: '2026-06-20',
        message: 'Mensaje generado por el script de verificacion de flujos.',
      },
    });
    cookie = guardada;
    return 'guardado';
  });

  await step('La trampa anti-robots rechaza el envio', async () => {
    const guardada = cookie;
    cookie = '';
    await api('/contact', {
      method: 'POST',
      expect: 400,
      body: {
        name: 'Robot',
        email: 'robot@spam.example',
        phone: '3001234567',
        eventType: 'Otro',
        message: 'Soy un robot y llene el campo trampa.',
        website: 'http://spam.example',
      },
    });
    cookie = guardada;
    return '400 como se espera';
  });

  await step('El mensaje aparece en el panel', async () => {
    const lista = await api('/admin/messages');
    const mio = lista.find((m) => m.email === correoPrueba);
    assert(mio, 'el mensaje no esta en la lista');
    assert(mio.status === 'nuevo', `llego con estado "${mio.status}"`);
    messageId = mio.id;
    return 'visible, estado nuevo';
  });

  await step('Cambiar el estado del mensaje', async () => {
    await api(`/admin/messages/${messageId}`, { method: 'PATCH', body: { status: 'respondido' } });
    const { data } = await db.from('contact_messages').select('status').eq('id', messageId).single();
    assert(data.status === 'respondido', 'no se guardo el estado');
    return 'respondido';
  });

  // ── 7. Contenido editable ──────────────────────────────────
  await step('Leer y reescribir el contenido del sitio', async () => {
    const actual = await api('/admin/content');
    assert(actual.content, 'la respuesta no trae content');
    assert(Array.isArray(actual.services), 'la respuesta no trae services');
    assert(Array.isArray(actual.testimonials), 'la respuesta no trae testimonials');

    const original = actual.content.about;
    assert(original, 'no hay bloque "about"; probablemente falta correr npm run seed');

    const marca = `Verificacion ${suffix}`;
    await api('/admin/content', {
      method: 'PUT',
      body: { key: 'about', value: { ...original, title: marca } },
    });

    const releido = await api('/admin/content');
    assert(releido.content.about.title === marca, 'el cambio no se guardo');

    await api('/admin/content', { method: 'PUT', body: { key: 'about', value: original } });
    const restaurado = await api('/admin/content');
    assert(restaurado.content.about.title === original.title, 'no se pudo restaurar el original');
    return 'ida, vuelta y restaurado';
  });

  await step('Cambiar la contrasena del administrador', async () => {
    const nueva = randomBytes(18).toString('base64url');
    await api('/auth/password', {
      method: 'POST',
      body: { currentPassword: adminPassword, newPassword: nueva },
    });

    const guardada = cookie;
    cookie = '';
    const r = await api('/auth/login', { method: 'POST', body: { email: adminEmail, password: nueva } });
    assert(r.admin?.email === adminEmail, 'no se pudo entrar con la contrasena nueva');
    if (!cookie) cookie = guardada;
    return 'cambiada y verificada';
  });

  // ── 8. Borrado y limpieza ──────────────────────────────────
  await step('Borrar una foto borra tambien sus archivos', async () => {
    const victima = photoIds[2];
    const { data: row } = await db.from('photos').select('storage_path').eq('id', victima).single();
    const base = row.storage_path.split('/').pop().replace(/-\d+\.jpg$/, '');

    await api(`/admin/photos/${victima}`, { method: 'DELETE' });

    const { data: existe } = await db.from('photos').select('id').eq('id', victima).maybeSingle();
    assert(!existe, 'la fila sigue en la base de datos');

    const { nombres } = await listarCarpeta(row.storage_path);
    const huerfanos = nombres.filter((n) => n.startsWith(base));
    assert(huerfanos.length === 0, `quedaron ${huerfanos.length} archivos huerfanos: ${huerfanos.slice(0, 3).join(', ')}`);

    photoIds = photoIds.filter((id) => id !== victima);
    return 'fila y archivos eliminados';
  });

  await step('Borrado multiple de fotos', async () => {
    const cuantas = photoIds.length;
    await api('/admin/photos/delete', { method: 'POST', body: { ids: photoIds } });
    const { count } = await db
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', albumId);
    assert(count === 0, `quedan ${count} fotos`);
    return `${cuantas} borradas`;
  });

  await step('Borrar el album deja el storage limpio', async () => {
    await api(`/admin/albums/${albumId}`, { method: 'DELETE' });

    const { data: existe } = await db.from('albums').select('id').eq('id', albumId).maybeSingle();
    assert(!existe, 'el album sigue en la base de datos');

    const { carpeta, nombres } = await listarCarpeta(rutaEjemplo);
    assert(nombres.length === 0, `quedaron ${nombres.length} archivos en ${carpeta}`);

    albumId = null;
    return 'sin restos';
  });

  await step('Borrar el mensaje de prueba', async () => {
    await api(`/admin/messages/${messageId}`, { method: 'DELETE' });
    const { data } = await db.from('contact_messages').select('id').eq('id', messageId).maybeSingle();
    assert(!data, 'el mensaje sigue ahi');
    messageId = null;
    return 'borrado';
  });

  await step('Cerrar sesion invalida la cookie', async () => {
    await api('/auth/logout', { method: 'POST' });
    await api('/admin/albums', { expect: 401 });
    return 'sesion cerrada';
  });
} finally {
  // ── Limpieza, pase lo que pase ─────────────────────────────
  const pendiente = [];

  /*
   * La carpeta se limpia a partir de rutaEjemplo, no consultando la tabla
   * photos: si el fallo fue justamente que quedaron archivos huerfanos, las
   * filas ya no estan y por la tabla no se llegaria a ellos.
   */
  if (rutaEjemplo) {
    const carpeta = rutaEjemplo.split('/').slice(0, -1).join('/');
    const { data: files } = await db.storage.from(BUCKET).list(carpeta, { limit: 1000 });
    if (files?.length) {
      await db.storage.from(BUCKET).remove(files.map((f) => `${carpeta}/${f.name}`));
      pendiente.push(`${files.length} archivos de prueba`);
    }
  }
  if (albumId) {
    await db.from('albums').delete().eq('id', albumId);
    pendiente.push('album de prueba');
  }
  if (messageId) {
    await db.from('contact_messages').delete().eq('id', messageId);
    pendiente.push('mensaje de prueba');
  }
  if (adminId) {
    await db.from('admins').delete().eq('id', adminId);
    pendiente.push('administrador desechable');
  }

  if (pendiente.length) console.log(`\n  Limpieza: ${pendiente.join(', ')}`);

  const ok = results.filter((r) => r.ok).length;
  const fallos = results.filter((r) => !r.ok);

  console.log(`\n  ${ok} de ${results.length} pasos correctos\n`);
  if (fallos.length) {
    console.log('  Fallaron:');
    for (const f of fallos) console.log(`    - ${f.name}: ${f.detail}`);
    console.log('');
    process.exitCode = 1;
  }
}
