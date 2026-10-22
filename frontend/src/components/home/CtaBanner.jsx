import { Link } from 'react-router-dom';
import SmartImage from '../ui/SmartImage';
import Icon from '../ui/Icon';
import Reveal from '../ui/Reveal';
import images from '../../data/images.json';
import { whatsappLink } from '../../lib/whatsapp';
import './CtaBanner.css';

/** Cierre de pagina: el ultimo empujon a escribir. */
export default function CtaBanner({ content }) {
  const { contact } = content;
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage);

  return (
    <section className="cta-banner">
      <div className="cta-banner__media">
        <SmartImage
          image={images.serviceEvents}
          alt=""
          sizes="100vw"
          aspectRatio="auto"
        />
      </div>

      <Reveal className="cta-banner__content container">
        <p className="eyebrow">¿Tienes fecha?</p>
        <h2>Cuéntame qué celebras</h2>
        <p className="lead">
          Respondo por WhatsApp el mismo día. Sin compromiso: me cuentas la fecha y el lugar,
          y te digo si tengo disponibilidad.
        </p>

        <div className="cta-banner__actions">
          {wa && (
            <a href={wa} className="btn btn--primary" target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} />
              Cotizar por WhatsApp
            </a>
          )}
          <Link to="/contacto" className="btn btn--ghost">
            Enviar un mensaje
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
