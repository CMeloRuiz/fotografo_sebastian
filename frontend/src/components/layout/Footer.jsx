import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import siteContent from '../../data/siteContent';
import { whatsappLink } from '../../lib/whatsapp';
import './Footer.css';

const QUICK_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/portafolio', label: 'Portafolio' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/sobre-mi', label: 'Sobre mí' },
  { to: '/contacto', label: 'Contacto' },
];

export default function Footer({ content = siteContent }) {
  const { contact, social, footer, identity } = content;
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage);
  const year = new Date().getFullYear();

  // Solo mostramos las redes que tengan URL configurada desde el panel.
  const activeSocial = social.filter((s) => s.url);

  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__brand">
          <picture>
            <source type="image/webp" srcSet="/media/logo.webp" />
            <img src="/media/logo.png" alt={identity.name} width="119" height="92" />
          </picture>
          <p>{footer.tagline}</p>
        </div>

        <div className="footer__col">
          <h2>Contacto</h2>
          <ul className="footer__contact">
            <li>
              <Icon name="mapPin" size={18} />
              <span>{contact.address}</span>
            </li>
            <li>
              <Icon name="phone" size={18} />
              <a href={`tel:${contact.phone.replace(/[^+0-9]/g, '')}`}>{contact.phone}</a>
            </li>
            <li>
              <Icon name="mail" size={18} />
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
            <li>
              <Icon name="clock" size={18} />
              <span>{contact.schedule}</span>
            </li>
          </ul>
        </div>

        <div className="footer__col">
          <h2>Enlaces</h2>
          <ul className="footer__links">
            {QUICK_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h2>Sígueme</h2>
          {activeSocial.length > 0 ? (
            <ul className="footer__social">
              {activeSocial.map((s) => (
                <li key={s.network}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                  >
                    <Icon name={s.network} size={19} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer__pending">
              Enlaces de redes pendientes de configurar desde el panel.
            </p>
          )}

          {wa && (
            <a href={wa} className="btn btn--primary footer__wa" target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} />
              Escríbeme
            </a>
          )}
        </div>
      </div>

      <div className="footer__bottom container">
        <p>
          &copy; {year} {identity.name}. Todos los derechos reservados.
        </p>
        <Link to="/admin" className="footer__admin">
          Panel
        </Link>
      </div>
    </footer>
  );
}
