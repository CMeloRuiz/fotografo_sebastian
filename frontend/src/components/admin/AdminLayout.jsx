import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/AuthProvider';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import './AdminLayout.css';

const NAV = [
  { to: '/admin', label: 'Inicio', icon: 'spark', end: true },
  { to: '/admin/albumes', label: 'Álbumes', icon: 'images' },
  { to: '/admin/contenido', label: 'Contenido', icon: 'portrait' },
  { to: '/admin/mensajes', label: 'Mensajes', icon: 'mail' },
  { to: '/admin/cuenta', label: 'Mi cuenta', icon: 'award' },
];

export default function AdminLayout({ newMessages = 0 }) {
  const { admin, logout } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { pathname } = useLocation();

  useLockBodyScroll(isNavOpen);
  useEffect(() => setIsNavOpen(false), [pathname]);

  return (
    <div className="admin admin-shell">
      <aside className={`admin-sidebar ${isNavOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar__brand">
          <picture>
            <source type="image/webp" srcSet="/media/logo.webp" />
            <img src="/media/logo.png" alt="" width="119" height="92" />
          </picture>
          <div>
            <strong>Panel</strong>
            <span>Sebastián Sisa</span>
          </div>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Secciones del panel">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.to === '/admin/mensajes' && newMessages > 0 && (
                <span className="badge badge--new">{newMessages}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__foot">
          <Link to="/" className="admin-sidebar__view" target="_blank" rel="noopener noreferrer">
            <Icon name="arrowRight" size={16} />
            Ver el sitio
          </Link>

          <div className="admin-sidebar__user">
            <span title={admin?.email}>{admin?.email}</span>
            <button type="button" className="abtn abtn--ghost abtn--sm" onClick={logout}>
              Salir
            </button>
          </div>
        </div>
      </aside>

      {isNavOpen && (
        <button
          type="button"
          className="admin-scrim"
          onClick={() => setIsNavOpen(false)}
          aria-label="Cerrar el menú"
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="abtn abtn--icon admin-topbar__burger"
            onClick={() => setIsNavOpen(true)}
            aria-label="Abrir el menú"
            aria-expanded={isNavOpen}
          >
            <Icon name="menu" size={20} />
          </button>
          <strong className="admin-topbar__title">Panel de administración</strong>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
