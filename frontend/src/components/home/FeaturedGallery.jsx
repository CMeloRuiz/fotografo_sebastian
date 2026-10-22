import { useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../ui/SectionHeading';
import SmartImage from '../ui/SmartImage';
import Lightbox from '../ui/Lightbox';
import Reveal from '../ui/Reveal';
import Icon from '../ui/Icon';
import DemoNotice from '../ui/DemoNotice';
import './FeaturedGallery.css';

/** Galeria destacada del home: una muestra que abre el visor a pantalla completa. */
export default function FeaturedGallery({ photos }) {
  const [openAt, setOpenAt] = useState(null);

  if (!photos.length) return null;

  const shown = photos.slice(0, 8);
  const hasDemo = shown.some((p) => p.isDemo);

  return (
    <section className="featured section" id="galeria">
      <div className="container">
        <SectionHeading
          eyebrow="Una muestra"
          title="Momentos que ya no vuelven"
          lead="Toca cualquier foto para verla en grande."
        />

        {hasDemo && (
          <div className="featured__notice">
            <DemoNotice />
          </div>
        )}

        <div className="featured__grid">
          {shown.map((photo, i) => (
            <Reveal
              key={photo.id}
              delay={i * 60}
              variant="zoom"
              className={`featured__cell featured__cell--${(i % 6) + 1}`}
            >
              <button
                type="button"
                className="featured__item"
                onClick={() => setOpenAt(i)}
                aria-label={`Ampliar: ${photo.alt || `foto ${i + 1}`}`}
              >
                <SmartImage
                  image={photo}
                  alt={photo.alt}
                  sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
                  aspectRatio="1 / 1"
                />
                <span className="featured__zoom" aria-hidden="true">
                  <Icon name="zoomIn" size={20} />
                </span>
              </button>
            </Reveal>
          ))}
        </div>

        <div className="featured__cta">
          <Link to="/portafolio" className="btn btn--ghost">
            Ver todo el portafolio
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </div>

      {openAt !== null && (
        <Lightbox photos={shown} startIndex={openAt} onClose={() => setOpenAt(null)} />
      )}
    </section>
  );
}
