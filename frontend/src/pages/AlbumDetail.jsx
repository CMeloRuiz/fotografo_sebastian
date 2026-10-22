import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SmartImage from '../components/ui/SmartImage';
import Lightbox from '../components/ui/Lightbox';
import Reveal from '../components/ui/Reveal';
import Icon from '../components/ui/Icon';
import DemoNotice from '../components/ui/DemoNotice';
import { useSiteData } from '../context/SiteDataProvider';
import useSeo from '../hooks/useSeo';
import { whatsappLink } from '../lib/whatsapp';
import NotFound from './NotFound';
import './AlbumDetail.css';

export default function AlbumDetail() {
  const { slug } = useParams();
  const { content, albums } = useSiteData();
  const [openAt, setOpenAt] = useState(null);

  const album = albums.find((a) => a.slug === slug);

  useSeo({
    title: album ? album.title : 'Álbum no encontrado',
    description: album?.description,
    image: album?.cover?.fallback,
    path: `/portafolio/${slug}`,
    type: 'article',
  });

  if (!album) return <NotFound />;

  const photos = album.photos || [];
  const categoryName = content.categories.find((c) => c.slug === album.category)?.name;
  const wa = whatsappLink(
    content.contact.whatsapp,
    `Hola Sebastián, vi el álbum "${album.title}" en tu portafolio y quiero cotizar mi evento.`,
  );

  return (
    <>
      <section className="album-hero">
        <div className="container">
          <Link to="/portafolio" className="album-hero__back">
            <Icon name="chevronLeft" size={16} />
            Volver al portafolio
          </Link>

          <p className="eyebrow">{categoryName}</p>
          <h1 className="album-hero__title">{album.title}</h1>
          {album.description && <p className="lead">{album.description}</p>}

          <p className="album-hero__meta">
            <Icon name="images" size={16} />
            {photos.length} fotos
          </p>
        </div>
      </section>

      <section className="section album-body">
        <div className="container">
          {album.isDemo && <DemoNotice />}

          {photos.length === 0 ? (
            <p className="album-body__empty">Este álbum todavía no tiene fotos publicadas.</p>
          ) : (
            <div className="album-grid">
              {photos.map((photo, i) => (
                <Reveal
                  key={photo.id}
                  variant="fade"
                  delay={(i % 4) * 70}
                  className="album-grid__cell"
                >
                  <button
                    type="button"
                    className="album-grid__item"
                    onClick={() => setOpenAt(i)}
                    aria-label={`Ampliar foto ${i + 1} de ${photos.length}`}
                  >
                    <SmartImage
                      image={photo}
                      alt={photo.alt || `${album.title}, foto ${i + 1}`}
                      sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 31vw"
                    />
                    <span className="album-grid__zoom" aria-hidden="true">
                      <Icon name="zoomIn" size={20} />
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          )}

          <div className="album-body__cta">
            <h2>¿Quieres algo así para tu evento?</h2>
            <div className="album-body__actions">
              {wa && (
                <a href={wa} className="btn btn--primary" target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={18} />
                  Cotizar por WhatsApp
                </a>
              )}
              <Link to="/contacto" className="btn btn--ghost">
                Enviar un mensaje
              </Link>
            </div>
          </div>
        </div>
      </section>

      {openAt !== null && (
        <Lightbox
          photos={photos}
          startIndex={openAt}
          albumTitle={album.title}
          onClose={() => setOpenAt(null)}
        />
      )}
    </>
  );
}
