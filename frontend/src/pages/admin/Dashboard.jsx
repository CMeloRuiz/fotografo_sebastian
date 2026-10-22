import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthProvider';
import './Dashboard.css';

const CARDS = [
  { key: 'albums', label: 'Álbumes', icon: 'images', to: '/admin/albumes' },
  { key: 'photos', label: 'Fotos', icon: 'camera', to: '/admin/albumes' },
  { key: 'publishedAlbums', label: 'Publicados', icon: 'eye', to: '/admin/albumes' },
  { key: 'newMessages', label: 'Mensajes nuevos', icon: 'inbox', to: '/admin/mensajes' },
];

export default function Dashboard() {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/admin/stats')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  const firstName = (admin?.name || admin?.email || '').split(/[\s@]/)[0];

  return (
    <>
      <div className="admin-section-title">
        <div>
          <h1>Hola{firstName ? `, ${firstName}` : ''}</h1>
          <p className="admin-hint">Esto es lo que hay en tu sitio ahora mismo.</p>
        </div>
        <Link to="/admin/albumes/nuevo" className="abtn abtn--primary">
          <Icon name="plus" size={17} />
          Nuevo álbum
        </Link>
      </div>

      {error && <p className="astate">{error}</p>}

      <div className="dash-cards">
        {CARDS.map((card) => (
          <Link to={card.to} className="dash-card" key={card.key}>
            <span className="dash-card__icon">
              <Icon name={card.icon} size={18} />
            </span>
            <span className="dash-card__value">
              {stats ? stats[card.key] : <span className="askeleton dash-card__skeleton" />}
            </span>
            <span className="dash-card__label">{card.label}</span>
          </Link>
        ))}
      </div>

      {stats?.demoPhotos > 0 && (
        <div className="dash-demo">
          <Icon name="spark" size={18} />
          <div>
            <strong>Tienes {stats.demoPhotos} fotos de ejemplo publicadas</strong>
            <p>
              Son imágenes de muestra para que el sitio no se viera vacío. Reemplázalas por tus
              fotos reales cuando tengas permiso de tus clientes: entra a un álbum, sube las
              tuyas y borra las de ejemplo.
            </p>
          </div>
          <Link to="/admin/albumes" className="abtn abtn--secondary">
            Ver álbumes
          </Link>
        </div>
      )}

      <section className="admin-card dash-recent">
        <div className="admin-section-title">
          <h2>Últimas fotos subidas</h2>
          <Link to="/admin/albumes" className="abtn abtn--ghost abtn--sm">
            Ver todo
          </Link>
        </div>

        {!stats ? (
          <div className="dash-recent__grid">
            {Array.from({ length: 6 }, (_, i) => (
              <span className="askeleton dash-recent__skeleton" key={i} />
            ))}
          </div>
        ) : stats.latestPhotos.length === 0 ? (
          <div className="astate">
            <Icon name="camera" size={30} />
            <h3>Todavía no has subido fotos</h3>
            <p>Crea tu primer álbum y sube las fotos de un evento. Puedes hacerlo desde el celular.</p>
            <Link to="/admin/albumes/nuevo" className="abtn abtn--primary">
              Crear mi primer álbum
            </Link>
          </div>
        ) : (
          <div className="dash-recent__grid">
            {stats.latestPhotos.map((photo) => (
              <img key={photo.id} src={photo.thumb} alt="" loading="lazy" decoding="async" />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
