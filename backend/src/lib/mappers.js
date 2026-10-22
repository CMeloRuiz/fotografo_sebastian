/**
 * Traduce las filas de Postgres (snake_case) a la forma que consume el
 * frontend (camelCase).
 *
 * El contrato importa: SmartImage y Lightbox esperan exactamente estas
 * claves, las mismas que genera scripts/optimize-images.cjs para las
 * imagenes del sitio. Asi una foto subida por el fotografo y una imagen de
 * build se pintan con el mismo componente.
 */

export function toPhoto(row) {
  if (!row) return null;
  const variants = row.variants || {};

  return {
    id: row.id,
    albumId: row.album_id,
    title: row.title || '',
    alt: row.alt || '',
    width: row.width,
    height: row.height,
    lqip: row.blur_placeholder || null,
    fallback: variants.fallback || null,
    thumb: variants.thumb || variants.fallback || null,
    avif: variants.avif || [],
    webp: variants.webp || [],
    isFeatured: row.is_featured,
    isDemo: row.is_demo,
    sortOrder: row.sort_order,
    bytes: row.bytes ?? null,
    createdAt: row.created_at,
  };
}

export function toAlbum(row, photos = []) {
  if (!row) return null;

  const mapped = photos.map(toPhoto);
  // La portada elegida a mano manda; si no hay, la primera foto del album.
  const cover =
    mapped.find((p) => p.id === row.cover_photo_id) || mapped[0] || null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    eventDate: row.event_date,
    description: row.description || '',
    cover,
    coverPhotoId: row.cover_photo_id,
    photos: mapped,
    photoCount: mapped.length,
    isPublished: row.is_published,
    isFeatured: row.is_featured,
    isDemo: row.is_demo,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTestimonial(row) {
  return {
    id: row.id,
    author: row.author,
    eventType: row.event_type || '',
    text: row.text,
    isPublished: row.is_published,
    isDemo: row.is_demo,
    sortOrder: row.sort_order,
  };
}

export function toService(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    features: row.features || [],
    priceLabel: row.price_label || 'Cotizar',
    image: row.image_key || 'serviceEvents',
    isPublished: row.is_published,
    sortOrder: row.sort_order,
  };
}

export function toMessage(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    eventType: row.event_type || '',
    eventDate: row.event_date,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

export default { toPhoto, toAlbum, toTestimonial, toService, toMessage };
