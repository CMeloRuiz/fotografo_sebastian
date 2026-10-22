import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import './Header.css';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/portafolio', label: 'Portafolio' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/sobre-mi', label: 'Sobre mí' },
];

export default function Header() {
  const [isCompact, setIsCompact] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useLockBodyScroll(isMenuOpen);

  // El header se compacta y gana fondo al bajar, para no tapar las fotos.
  useEffect(() => {
    const onScroll = () => setIsCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cambiar de ruta cierra el menu movil.
  useEffect(() => setIsMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && setIsMenuOpen(false);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  return (
    <header className={`header ${isCompact ? 'is-compact' : ''} ${isMenuOpen ? 'is-open' : ''}`}>
      <div className="header__inner">
        <Link to="/" className="header__logo" aria-label="Sebastián Sisa, ir al inicio">
          <picture>
            <source type="image/webp" srcSet="/media/logo.webp" />
            <img src="/media/logo.png" alt="Sebastián Sisa" width="119" height="92" />
          </picture>
        </Link>

        <nav className="header__nav" aria-label="Navegación principal">
          <ul>
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link to="/contacto" className="btn btn--primary header__cta">
                Contacto
              </Link>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="header__burger"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? 'Cerrar el menú' : 'Abrir el menú'}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div id="mobile-menu" className="header__mobile" hidden={!isMenuOpen}>
        <nav aria-label="Navegación móvil">
          <ul>
            {LINKS.map((link, i) => (
              <li key={link.to} style={{ transitionDelay: `${60 + i * 50}ms` }}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li style={{ transitionDelay: `${60 + LINKS.length * 50}ms` }}>
              <Link to="/contacto" className="btn btn--primary header__mobile-cta">
                Contacto
                <Icon name="arrowRight" size={18} />
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
