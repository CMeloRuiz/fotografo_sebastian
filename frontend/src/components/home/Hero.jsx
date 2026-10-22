import { Link } from 'react-router-dom';
import SmartImage from '../ui/SmartImage';
import Icon from '../ui/Icon';
import images from '../../data/images.json';
import { whatsappLink } from '../../lib/whatsapp';
import './Hero.css';

/**
 * Hero a pantalla completa.
 *
 * Es la unica imagen del sitio que se carga con prioridad alta: es el LCP.
 * El sitio antiguo fijaba height: 2000px y background-size: 100% 100%, que
 * deformaba la foto y empujaba el resto de la pagina fuera de la pantalla.
 */
export default function Hero({ content }) {
  const { hero, contact } = content;
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage);
  // Si el fotógrafo cambió el fondo desde el panel, manda el suyo.
  const media = content.heroMedia || images.hero;

  return (
    <section className="hero">
      <div className="hero__media">
        <SmartImage
          image={media}
          alt="Celebración registrada por Sebastián Sisa"
          sizes="100vw"
          priority
          objectPosition="center 30%"
        />
      </div>

      <div className="hero__content container">
        <p className="eyebrow hero__eyebrow">{hero.eyebrow}</p>
        <h1 className="hero__title">{hero.title}</h1>
        <p className="hero__subtitle">{hero.subtitle}</p>

        <div className="hero__actions">
          <Link to={hero.primaryCta.href} className="btn btn--primary">
            {hero.primaryCta.label}
            <Icon name="arrowRight" size={18} />
          </Link>
          {wa && (
            <a href={wa} className="btn btn--ghost" target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} />
              {hero.secondaryCta.label}
            </a>
          )}
        </div>
      </div>

      <a className="hero__scroll" href="#sobre-mi" aria-label="Bajar al contenido">
        <Icon name="arrowDown" size={20} />
      </a>
    </section>
  );
}
