import { useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastProvider';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import './PhotoEditor.css';

/**
 * Editor de una foto.
 *
 * Dos cosas separadas en la misma ventana:
 *   - texto (titulo, descripcion alternativa), que se guarda al instante;
 *   - recorte y rotacion, que obligan a regenerar todas las variantes en el
 *     servidor y por eso se aplican con su propio boton.
 *
 * El recorte se dibuja sobre la foto mostrada y se manda en proporciones
 * (0 a 1); el backend las traduce al tamano real del archivo.
 */
export default function PhotoEditor({ photo, onClose, onSaved }) {
  const toast = useToast();
  useLockBodyScroll(true);

  const [title, setTitle] = useState(photo.title || '');
  const [alt, setAlt] = useState(photo.alt || '');
  const [rotate, setRotate] = useState(0);
  const [crop, setCrop] = useState(null); // {x, y, w, h} en proporciones
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const stageRef = useRef(null);
  const dragStart = useRef(null);

  const saveText = async () => {
    setIsSaving(true);
    try {
      const updated = await api.patch(`/api/admin/photos/${photo.id}`, { title, alt });
      toast.success('Textos guardados.');
      onSaved({ ...photo, ...updated });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const applyTransform = async () => {
    setIsApplying(true);
    try {
      const payload = {};
      if (rotate) payload.rotate = rotate;
      if (crop) {
        payload.crop = {
          left: Math.round(crop.x * photo.width),
          top: Math.round(crop.y * photo.height),
          width: Math.round(crop.w * photo.width),
          height: Math.round(crop.h * photo.height),
        };
      }

      const updated = await api.post(`/api/admin/photos/${photo.id}/transform`, payload);
      toast.success('Foto actualizada.');
      onSaved({ ...updated, title, alt });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  // ── Dibujo del recorte ──────────────────────────────────
  const pointToRatio = (event) => {
    const rect = stageRef.current.getBoundingClientRect();
    return {
      x: Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1),
    };
  };

  const onPointerDown = (event) => {
    event.preventDefault();
    dragStart.current = pointToRatio(event);
    setCrop(null);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragStart.current) return;
    const now = pointToRatio(event);
    const start = dragStart.current;

    setCrop({
      x: Math.min(start.x, now.x),
      y: Math.min(start.y, now.y),
      w: Math.abs(now.x - start.x),
      h: Math.abs(now.y - start.y),
    });
  };

  const onPointerUp = () => {
    dragStart.current = null;
    // Un arrastre minusculo casi siempre es un clic accidental
    setCrop((c) => (c && (c.w < 0.05 || c.h < 0.05) ? null : c));
  };

  const hasEdits = rotate !== 0 || crop !== null;

  return (
    <div
      className="admin photo-editor-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Editar foto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="photo-editor">
        <header className="photo-editor__head">
          <h2>Editar foto</h2>
          <button type="button" className="abtn abtn--icon" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="photo-editor__body">
          <div className="photo-editor__preview">
            <div
              className="photo-editor__stage"
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                src={photo.fallback}
                alt={alt || ''}
                style={{ transform: `rotate(${rotate}deg)` }}
                draggable={false}
              />
              {crop && (
                <span
                  className="photo-editor__crop"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.w * 100}%`,
                    height: `${crop.h * 100}%`,
                  }}
                />
              )}
            </div>

            <div className="photo-editor__tools">
              <button
                type="button"
                className="abtn abtn--secondary abtn--sm"
                onClick={() => setRotate((r) => (r + 270) % 360)}
              >
                <Icon name="rotate" size={15} />
                Girar izquierda
              </button>
              <button
                type="button"
                className="abtn abtn--secondary abtn--sm"
                onClick={() => setRotate((r) => (r + 90) % 360)}
              >
                <Icon name="rotate" size={15} style={{ transform: 'scaleX(-1)' }} />
                Girar derecha
              </button>
              {hasEdits && (
                <button
                  type="button"
                  className="abtn abtn--ghost abtn--sm"
                  onClick={() => {
                    setRotate(0);
                    setCrop(null);
                  }}
                >
                  Deshacer
                </button>
              )}
            </div>

            <p className="admin-hint">
              Arrastra sobre la foto para marcar el recorte. Los cambios se aplican cuando
              pulsas el botón de abajo.
            </p>

            <button
              type="button"
              className="abtn abtn--primary"
              onClick={applyTransform}
              disabled={!hasEdits || isApplying}
            >
              {isApplying ? 'Procesando...' : 'Aplicar recorte y giro'}
            </button>
          </div>

          <div className="photo-editor__form">
            <div className="afield">
              <label htmlFor="photo-title">Título</label>
              <input
                id="photo-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Opcional. Sale debajo de la foto al ampliarla."
              />
            </div>

            <div className="afield">
              <label htmlFor="photo-alt">Descripción de la imagen</label>
              <textarea
                id="photo-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe qué se ve. Ej: los novios bailando el vals."
              />
              <p className="admin-hint">
                La leen las personas ciegas y también Google. Ayuda a que tus fotos aparezcan
                en las búsquedas.
              </p>
            </div>

            <button
              type="button"
              className="abtn abtn--primary"
              onClick={saveText}
              disabled={isSaving}
            >
              <Icon name="save" size={16} />
              {isSaving ? 'Guardando...' : 'Guardar textos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
