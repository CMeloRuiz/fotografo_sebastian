import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Sortable from '../../components/admin/Sortable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastProvider';
import './Albums.css';

function formatDate(iso) {
  if (!iso) return 'Sin fecha';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Albums() {
  const toast = useToast();
  const [albums, setAlbums] = useState(null);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () =>
    api
      .get('/api/admin/albums')
      .then(setAlbums)
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const onReorder = async (ids) => {
    try {
      await api.put('/api/admin/albums/reorder', { ids });
      toast.success('Orden guardado.');
    } catch (err) {
      toast.error(`No se pudo guardar el orden: ${err.message}`);
      load();
    }
  };

  const togglePublished = async (album) => {
    try {
      const updated = await api.patch(`/api/admin/albums/${album.id}`, {
        isPublished: !album.isPublished,
      });
      setAlbums((list) => list.map((a) => (a.id === album.id ? { ...a, ...updated } : a)));
      toast.success(updated.isPublished ? 'Álbum publicado.' : 'Álbum pasado a borrador.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/albums/${toDelete.id}`);
      setAlbums((list) => list.filter((a) => a.id !== toDelete.id));
      toast.success(`"${toDelete.title}" eliminado.`);
      setToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="admin-section-title">
        <div>
          <h1>Álbumes</h1>
          <p className="admin-hint">
            Arrastra con el tirador para cambiar el orden en que salen en el portafolio.
          </p>
        </div>
        <Link to="/admin/albumes/nuevo" className="abtn abtn--primary">
          <Icon name="plus" size={17} />
          Nuevo álbum
        </Link>
      </div>

      {error && (
        <div className="astate">
          <Icon name="close" size={28} />
          <h3>No se pudieron cargar los álbumes</h3>
          <p>{error}</p>
          <button type="button" className="abtn abtn--secondary" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {!albums && !error && (
        <div className="album-rows">
          {Array.from({ length: 3 }, (_, i) => (
            <span className="askeleton album-row__skeleton" key={i} />
          ))}
        </div>
      )}

      {albums?.length === 0 && (
        <div className="astate">
          <Icon name="images" size={32} />
          <h3>Todavía no tienes álbumes</h3>
          <p>
            Un álbum es un evento: un matrimonio, unos quince años, un bautizo. Crea el primero
            y sube sus fotos.
          </p>
          <Link to="/admin/albumes/nuevo" className="abtn abtn--primary">
            Crear mi primer álbum
          </Link>
        </div>
      )}

      {albums?.length > 0 && (
        <Sortable
          items={albums}
          onReorder={onReorder}
          className="album-rows"
          renderItem={(album, { handleProps }) => (
            <article className="album-row">
              <button type="button" {...handleProps}>
                <span className="visually-hidden">Reordenar</span>
              </button>

              <Link to={`/admin/albumes/${album.id}`} className="album-row__cover">
                {album.cover?.thumb || album.cover?.fallback ? (
                  <img
                    src={album.cover.thumb || album.cover.fallback}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="album-row__cover-empty">
                    <Icon name="camera" size={18} />
                  </span>
                )}
              </Link>

              <div className="album-row__main">
                <Link to={`/admin/albumes/${album.id}`} className="album-row__title">
                  {album.title}
                </Link>
                <p className="album-row__meta">
                  {album.photoCount} fotos · {formatDate(album.eventDate)}
                </p>
              </div>

              <div className="album-row__badges">
                <span className={`badge ${album.isPublished ? 'badge--live' : 'badge--draft'}`}>
                  {album.isPublished ? 'Publicado' : 'Borrador'}
                </span>
                {album.isDemo && <span className="badge badge--demo">Ejemplo</span>}
              </div>

              <div className="album-row__actions">
                <button
                  type="button"
                  className="abtn abtn--icon"
                  onClick={() => togglePublished(album)}
                  aria-label={album.isPublished ? 'Pasar a borrador' : 'Publicar'}
                  title={album.isPublished ? 'Pasar a borrador' : 'Publicar'}
                >
                  <Icon name={album.isPublished ? 'eyeOff' : 'eye'} size={17} />
                </button>
                <Link
                  to={`/admin/albumes/${album.id}`}
                  className="abtn abtn--icon"
                  aria-label={`Editar ${album.title}`}
                  title="Editar"
                >
                  <Icon name="edit" size={17} />
                </Link>
                <button
                  type="button"
                  className="abtn abtn--icon"
                  onClick={() => setToDelete(album)}
                  aria-label={`Eliminar ${album.title}`}
                  title="Eliminar"
                >
                  <Icon name="trash" size={17} />
                </button>
              </div>
            </article>
          )}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`¿Eliminar "${toDelete.title}"?`}
          message={`Se borrarán también sus ${toDelete.photoCount} fotos, y no se pueden recuperar.`}
          confirmLabel="Sí, eliminar"
          isBusy={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}

export { formatDate };
