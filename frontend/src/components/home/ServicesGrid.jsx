import { Link } from 'react-router-dom';
import SmartImage from '../ui/SmartImage';
import Reveal from '../ui/Reveal';
import Icon from '../ui/Icon';
import images from '../../data/images.json';
import './ServicesGrid.css';

const SERVICE_ICONS = {
  'eventos-sociales': 'camera',
  videografia: 'video',
  'sesiones-estudio': 'portrait',
  comercial: 'building',
};

/** Tarjetas de servicio. Se usa igual en el home y en la pagina de servicios. */
export default function ServicesGrid({ services }) {
  return (
    <div className="services-grid">
      {services.map((service, i) => (
        <Reveal as="article" className="service-card" key={service.slug} delay={i * 80}>
          <div className="service-card__media">
            <SmartImage
              image={images[service.image]}
              alt={service.title}
              sizes="(max-width: 760px) 92vw, 46vw"
              aspectRatio="16 / 9"
            />
            <span className="service-card__icon" aria-hidden="true">
              <Icon name={SERVICE_ICONS[service.slug] || 'camera'} size={22} />
            </span>
          </div>

          <div className="service-card__body">
            <h3>{service.title}</h3>
            <p className="service-card__desc">{service.description}</p>

            <ul className="service-card__features">
              {service.features.map((feature) => (
                <li key={feature}>
                  <Icon name="check" size={15} />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="service-card__footer">
              <span className="service-card__price">{service.priceLabel}</span>
              <Link to="/contacto" className="btn btn--ghost service-card__cta">
                Consultar
                <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
