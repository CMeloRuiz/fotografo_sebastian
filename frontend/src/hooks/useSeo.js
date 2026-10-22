import { useEffect } from 'react';

const SITE_NAME = 'Sebastián Sisa | Fotografía y video';
const DEFAULT_IMAGE = '/media/hero-1200.jpg';

function upsertMeta(selector, attrs) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }
  Object.entries(attrs).forEach(([key, value]) => tag.setAttribute(key, value));
  return tag;
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

/**
 * Mantiene el title, la descripcion, el canonical y las etiquetas Open Graph
 * al dia en cada ruta. Es una alternativa minima a react-helmet: el sitio no
 * necesita mas que esto y asi no sumamos una dependencia.
 */
export default function useSeo({ title, description, image, path, type = 'website' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Sebastián Sisa` : SITE_NAME;
    const url = `${window.location.origin}${path || window.location.pathname}`;
    const img = `${window.location.origin}${image || DEFAULT_IMAGE}`;

    document.title = fullTitle;

    if (description) {
      upsertMeta('meta[name="description"]', { name: 'description', content: description });
    }

    upsertLink('canonical', url);

    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: img });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'es_CO' });
    if (description) {
      upsertMeta('meta[property="og:description"]', {
        property: 'og:description',
        content: description,
      });
    }

    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: img });
    if (description) {
      upsertMeta('meta[name="twitter:description"]', {
        name: 'twitter:description',
        content: description,
      });
    }
  }, [title, description, image, path, type]);
}
