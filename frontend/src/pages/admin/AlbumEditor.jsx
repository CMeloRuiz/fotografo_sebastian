import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Sortable from '../../components/admin/Sortable';
import Dropzone from '../../components/admin/Dropzone';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import PhotoEditor from '../../components/admin/PhotoEditor';
import { api, uploadWithProgress } from '../../lib/api';
import { useToast } from '../../context/ToastProvider';
import { useSiteData } from '../../context/SiteDataProvider';
import './AlbumEditor.css';

const EMPTY = {
  title: '',
  category: '',
  eventDate: '',
  description: '',
  isPublished: false,
  isFeatured: false,
};

export default function AlbumEditor() {
  const { id } = useParams();
  const isNew = id === 'nuevo';
  const navigate = useNavigate();
  const toast = useToast();
  const { content } = useSiteData();

  const [form, setForm] = useState(EMPTY);
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [uploads, setUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [selected, setSelected] = useState(new Set());
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const categories = content.categories || [];

  useEffect(() => {
    if (isNew) return;
    api
      .get(`/api/admin/albums/${id}`)
      .then((data) => {
        setAlbum(data);
        setPhotos(data.photos);
        setForm({
          title: data.title,
          category: data.category,
          eventDate: data.eventDate || '',
          description: data.description || '',
          isPublished: data.isPublished,
          isFeatured: data.isFeatured,
        });
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
    // toast es estable; el efecto solo debe reaccionar al id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const set = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const save = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.title.trim().length < 2) found.title = 'Ponle un nombre al álbum.';
    if (!form.category) found.category = 'Elige el tipo de evento.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSaving(true);
    try {
      if (isNew) {
        const created = await api.post('/api/admin/albums', form);
        toast.success('Álbum creado. Ahora sube sus fotos.');
        navigate(`/admin/albumes/${created.id}`, { replace: true });
      } else {
        const updated = await api.patch(`/api/admin/albums/${id}`, form);
        setAlbum(updated);
        toast.success('Cambios guardados.');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /** Sube las fotos de una en una, para poder mostrar el avance archivo a archivo. */
  const onFiles = async (files) => {
    setIsUploading(true);
    setUploads(files.map((f) => ({ name: f.name, percent: 0, status: 'uploading' })));

    const added = [];

    for (const [index, file] of files.entries()) {
      const formData = new FormData();
      formData.append('photos', file);

      try {
        const result = await uploadWithProgress(
          `/api/admin/albums/${id}/photos`,
          formData,
          (percent) =>
            setUploads((list) =>
              list.map((u, i) => (i === index ? { ...u, percent } : u)),
            ),
        );

        if (result.uploaded?.length) {
          added.push(...result.uploaded);
          setUploads((list) =>
            list.map((u, i) => (i === index ? { ...u, percent: 100, status: 'done' } : u)),
          );
        } else {
          throw new Error(result.failed?.[0]?.error || 'No se pudo procesar.');
        }
      } catch (err) {
        setUploads((list) =>
          list.map((u, i) => (i === index ? { ...u, status: 'error' } : u)),
        );
        toast.error(`${file.name}: ${err.message}`);
      }
    }

    if (added.length) {
      setPhotos((list) => [...list, ...added]);
      toast.success(
        added.length === 1 ? 'Foto subida.' : `${added.length} fotos subidas.`,
      );
      // Si el álbum no tenía portada, el backend puso la primera: lo reflejamos
      if (!album?.coverPhotoId) {
        setAlbum((a) => (a ? { ...a, coverPhotoId: added[0].id } : a));
      }
    }

    setIsUploading(false);
    setTimeout(() => setUploads([]), 2500);
  };

  const onReorder = async (ids) => {
    try {
      await api.put('/api/admin/photos/reorder', { ids });
      setPhotos((list) => ids.map((pid) => list.find((p) => p.id === pid)).filter(Boolean));
      toast.success('Orden guardado.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const setCover = async (photo) => {
    try {
      await api.post(`/api/admin/photos/${photo.id}/cover`);
      setAlbum((a) => ({ ...a, coverPhotoId: photo.id }));
      toast.success('Portada actualizada.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleSelected = (photoId) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const deleteSelected = async () => {
    setIsBusy(true);
    try {
      const ids = [...selected];
      await api.post('/api/admin/photos/delete', { ids });
      setPhotos((list) => list.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
      setConfirm(null);
      toast.success(ids.length === 1 ? 'Foto eliminada.' : `${ids.length} fotos eliminadas.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const title = useMemo(
    () => (isNew ? 'Nuevo álbum' : album?.title || 'Álbum'),
    [isNew, album],
  );

  if (isLoading) {
    return (
      <div className="astate">
        <span className="aspinner" />
        <p>Cargando el álbum...</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-section-title">
        <div>
          <Link to="/admin/albumes" className="editor__back">
            <Icon name="chevronLeft" size={15} />
            Álbumes
          </Link>
          <h1>{title}</h1>
        </div>

        {!isNew && album?.isPublished && (
          <a
            href={`/portafolio/${album.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="abtn abtn--secondary"
          >
            <Icon name="eye" size={17} />
            Ver en el sitio
          </a>
        )}
      </div>

      <form className="admin-card editor__form" onSubmit={save}>
        <div className="afield">
          <label htmlFor="title">Nombre del álbum</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={set('title')}
            placeholder="Matrimonio de Ana y Luis"
          />
          {errors.title && <p className="afield__error">{errors.title}</p>}
        </div>

        <div className="afield-row">
          <div className="afield">
            <label htmlFor="category">Tipo de evento</label>
            <select id="category" value={form.category} onChange={set('category')}>
              <option value="">Elige una opción</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="afield__error">{errors.category}</p>}
          </div>

          <div className="afield">
            <label htmlFor="eventDate">Fecha del evento</label>
            <input id="eventDate" type="date" value={form.eventDate} onChange={set('eventDate')} />
          </div>
        </div>

        <div className="afield">
          <label htmlFor="description">Descripción corta</label>
          <textarea
            id="description"
            value={form.description}
            onChange={set('description')}
            placeholder="Una línea sobre el evento. Sale debajo del título en el sitio."
          />
        </div>

        <div className="editor__switches">
          <label className="aswitch">
            <input type="checkbox" checked={form.isPublished} onChange={set('isPublished')} />
            <span className="aswitch__track" />
            <span className="aswitch__label">
              Publicado
              <span className="admin-hint"> — visible para todo el mundo</span>
            </span>
          </label>

          <label className="aswitch">
            <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} />
            <span className="aswitch__track" />
            <span className="aswitch__label">
              Destacado
              <span className="admin-hint"> — aparece en la portada</span>
            </span>
          </label>
        </div>

        <button type="submit" className="abtn abtn--primary" disabled={isSaving}>
          <Icon name="save" size={17} />
          {isSaving ? 'Guardando...' : isNew ? 'Crear álbum' : 'Guardar cambios'}
        </button>
      </form>

      {isNew ? (
        <p className="admin-hint editor__after-create">
          Crea el álbum primero y enseguida podrás subirle fotos.
        </p>
      ) : (
        <section className="editor__photos">
          <div className="admin-section-title">
            <div>
              <h2>Fotos ({photos.length})</h2>
              <p className="admin-hint">
                Arrastra con el tirador para cambiar el orden. Toca una foto para seleccionarla.
              </p>
            </div>

            {selected.size > 0 && (
              <div className="editor__bulk">
                <span>{selected.size} seleccionadas</span>
                <button
                  type="button"
                  className="abtn abtn--ghost abtn--sm"
                  onClick={() => setSelected(new Set())}
                >
                  Quitar selección
                </button>
                <button
                  type="button"
                  className="abtn abtn--danger abtn--sm"
                  onClick={() => setConfirm('bulk')}
                >
                  <Icon name="trash" size={15} />
                  Eliminar
                </button>
              </div>
            )}
          </div>

          <Dropzone onFiles={onFiles} isBusy={isUploading} progress={uploads} />

          {photos.length > 0 && (
            <Sortable
              items={photos}
              onReorder={onReorder}
              className="sortable--grid editor__grid"
              renderItem={(photo, { handleProps }) => {
                const isCover = album?.coverPhotoId === photo.id;
                const isSelected = selected.has(photo.id);

                return (
                  <div className={`photo-tile ${isSelected ? 'is-selected' : ''}`}>
                    <button
                      type="button"
                      className="photo-tile__select"
                      onClick={() => toggleSelected(photo.id)}
                      aria-pressed={isSelected}
                      aria-label={isSelected ? 'Quitar de la selección' : 'Seleccionar foto'}
                    >
                      <img
                        src={photo.thumb || photo.fallback}
                        alt={photo.alt || ''}
                        loading="lazy"
                        decoding="async"
                      />
                      {isSelected && (
                        <span className="photo-tile__check">
                          <Icon name="check" size={15} />
                        </span>
                      )}
                    </button>

                    {isCover && <span className="badge badge--live photo-tile__cover">Portada</span>}
                    {photo.isDemo && <span className="badge badge--demo photo-tile__demo">Ejemplo</span>}

                    <div className="photo-tile__bar">
                      <button type="button" {...handleProps}>
                        <span className="visually-hidden">Reordenar</span>
                      </button>

                      <button
                        type="button"
                        className="abtn abtn--icon abtn--sm"
                        onClick={() => setCover(photo)}
                        disabled={isCover}
                        aria-label="Usar como portada"
                        title="Usar como portada"
                      >
                        <Icon name="star" size={15} />
                      </button>

                      <button
                        type="button"
                        className="abtn abtn--icon abtn--sm"
                        onClick={() => setEditingPhoto(photo)}
                        aria-label="Editar foto"
                        title="Editar"
                      >
                        <Icon name="edit" size={15} />
                      </button>

                      <button
                        type="button"
                        className="abtn abtn--icon abtn--sm"
                        onClick={() => setConfirm(photo)}
                        aria-label="Eliminar foto"
                        title="Eliminar"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </section>
      )}

      {editingPhoto && (
        <PhotoEditor
          photo={editingPhoto}
          albums={album ? [album] : []}
          onClose={() => setEditingPhoto(null)}
          onSaved={(updated) => {
            setPhotos((list) => list.map((p) => (p.id === updated.id ? updated : p)));
            setEditingPhoto(null);
          }}
        />
      )}

      {confirm === 'bulk' && (
        <ConfirmDialog
          title={`¿Eliminar ${selected.size} fotos?`}
          message="Se borran del sitio y del almacenamiento. No se pueden recuperar."
          confirmLabel="Sí, eliminar"
          isBusy={isBusy}
          onConfirm={deleteSelected}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm && confirm !== 'bulk' && (
        <ConfirmDialog
          title="¿Eliminar esta foto?"
          message="Se borra del sitio y del almacenamiento. No se puede recuperar."
          confirmLabel="Sí, eliminar"
          isBusy={isBusy}
          onConfirm={async () => {
            setIsBusy(true);
            try {
              await api.delete(`/api/admin/photos/${confirm.id}`);
              setPhotos((list) => list.filter((p) => p.id !== confirm.id));
              setConfirm(null);
              toast.success('Foto eliminada.');
            } catch (err) {
              toast.error(err.message);
            } finally {
              setIsBusy(false);
            }
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
