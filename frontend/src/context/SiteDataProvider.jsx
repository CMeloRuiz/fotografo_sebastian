import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, hasBackend } from '../lib/api';
import staticContent from '../data/siteContent';
import { defaultAlbums, featuredPhotos as staticFeatured } from '../data/albums';

const SiteDataContext = createContext(null);

/**
 * Una sola fuente de contenido para todo el sitio publico.
 *
 * Arranca con el contenido estatico, que es el que vino del sitio antiguo, y
 * si hay backend lo reemplaza por lo que el fotografo haya guardado en el
 * panel. Si la API falla, el sitio sigue mostrando el contenido estatico en
 * lugar de quedarse en blanco.
 */
export function SiteDataProvider({ children }) {
  const [content, setContent] = useState(staticContent);
  const [albums, setAlbums] = useState(defaultAlbums);
  const [isLoading, setIsLoading] = useState(hasBackend);

  useEffect(() => {
    if (!hasBackend) return undefined;

    const controller = new AbortController();

    Promise.all([
      api.get('/api/content', { signal: controller.signal }),
      api.get('/api/albums', { signal: controller.signal }),
    ])
      .then(([remoteContent, remoteAlbums]) => {
        // Fusion superficial: lo que el panel no haya definido mantiene su
        // valor original, para que nunca se vea una seccion vacia.
        if (remoteContent) setContent((prev) => ({ ...prev, ...remoteContent }));
        if (Array.isArray(remoteAlbums) && remoteAlbums.length) setAlbums(remoteAlbums);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.warn('No se pudo cargar el contenido del backend; se usa el estático.', error);
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  const featuredPhotos = useMemo(() => {
    if (albums === defaultAlbums) return staticFeatured;
    return albums
      .filter((album) => album.isFeatured)
      .flatMap((album) =>
        (album.photos || [])
          .slice(0, 2)
          .map((photo) => ({ ...photo, albumSlug: album.slug, albumTitle: album.title })),
      );
  }, [albums]);

  const value = useMemo(
    () => ({ content, albums, featuredPhotos, isLoading }),
    [content, albums, featuredPhotos, isLoading],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const context = useContext(SiteDataContext);
  if (!context) throw new Error('useSiteData debe usarse dentro de SiteDataProvider');
  return context;
}

export default SiteDataProvider;
