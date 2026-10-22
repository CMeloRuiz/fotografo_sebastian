import images from './images.json';

/**
 * Albumes de demostracion.
 *
 * IMPORTANTE: las fotos de los albumes reales del sitio antiguo son privadas
 * de cada cliente y no se migraron. Mientras no existan las imagenes de
 * ejemplo generadas con IA (Fase 4), estos albumes se arman con las imagenes
 * publicas propias del fotografo que ya estaban en el sitio, solo para poder
 * ver y probar la maqueta de la galeria.
 *
 * Todo lo que sale de aqui lleva isDemo: true, el sitio lo muestra con un
 * aviso visible y el fotografo lo reemplaza desde el panel.
 */

const PLACEHOLDER_POOL = [
  'hero',
  'serviceEvents',
  'servicePortrait',
  'serviceVideo',
  'serviceCommercial',
  'portraitAlt',
  'portrait',
];

/** Reparte el fondo de imagenes disponibles para llenar un album. */
function buildPhotos(albumSlug, count) {
  return Array.from({ length: count }, (_, i) => {
    const key = PLACEHOLDER_POOL[i % PLACEHOLDER_POOL.length];
    const source = images[key];
    return {
      id: `${albumSlug}-${i + 1}`,
      ...source,
      title: '',
      alt: `Imagen de ejemplo ${i + 1} del álbum`,
      isFeatured: i === 0,
      sortOrder: i,
      isDemo: true,
    };
  });
}

const DEFINITIONS = [
  {
    slug: 'matrimonio-ejemplo',
    title: 'Matrimonio de ejemplo',
    category: 'matrimonios',
    eventDate: '2025-11-15',
    description: 'Álbum de muestra para la categoría de matrimonios.',
    photoCount: 9,
    isFeatured: true,
  },
  {
    slug: 'quince-anos-ejemplo',
    title: 'Quince años de ejemplo',
    category: 'quince-anos',
    eventDate: '2025-09-20',
    description: 'Álbum de muestra para la categoría de quince años.',
    photoCount: 8,
    isFeatured: true,
  },
  {
    slug: 'bautizo-ejemplo',
    title: 'Bautizo de ejemplo',
    category: 'bautizos',
    eventDate: '2025-07-06',
    description: 'Álbum de muestra para la categoría de bautizos.',
    photoCount: 7,
    isFeatured: true,
  },
  {
    slug: 'evento-musical-ejemplo',
    title: 'Evento musical de ejemplo',
    category: 'eventos-musicales',
    eventDate: '2025-08-30',
    description: 'Álbum de muestra para videoclips y conciertos.',
    photoCount: 8,
    isFeatured: true,
  },
  {
    slug: 'retratos-ejemplo',
    title: 'Retratos de ejemplo',
    category: 'retratos',
    eventDate: '2025-06-12',
    description: 'Álbum de muestra para sesiones de estudio y exteriores.',
    photoCount: 6,
    isFeatured: false,
  },
  {
    slug: 'comercial-ejemplo',
    title: 'Comercial de ejemplo',
    category: 'comercial',
    eventDate: '2025-05-02',
    description: 'Álbum de muestra para producto y publicidad.',
    photoCount: 6,
    isFeatured: false,
  },
];

export const demoAlbums = DEFINITIONS.map((def, i) => {
  const photos = buildPhotos(def.slug, def.photoCount);
  return {
    id: `demo-${def.slug}`,
    slug: def.slug,
    title: def.title,
    category: def.category,
    eventDate: def.eventDate,
    description: def.description,
    cover: photos[0],
    photos,
    photoCount: photos.length,
    isPublished: true,
    isFeatured: def.isFeatured,
    sortOrder: i,
    isDemo: true,
  };
});

/** Las fotos destacadas que aparecen en la galeria del home. */
export const featuredPhotos = demoAlbums
  .filter((album) => album.isFeatured)
  .flatMap((album) =>
    album.photos.slice(0, 2).map((photo) => ({ ...photo, albumSlug: album.slug, albumTitle: album.title })),
  );

export default demoAlbums;
