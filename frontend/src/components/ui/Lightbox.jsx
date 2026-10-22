import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import './Lightbox.css';

const SWIPE_THRESHOLD = 55;
const ZOOM_LEVEL = 2.4;

const srcSetOf = (list) => (list || []).map((v) => `${v.url} ${v.w}w`).join(', ');

/**
 * Visor de fotos propio. Sin dependencias.
 *
 * Teclado: flechas para navegar, Escape para cerrar.
 * Tactil: deslizar para cambiar de foto, doble toque para acercar.
 * Precarga la siguiente y la anterior, para que pasar fotos sea instantaneo.
 */
export default function Lightbox({ photos, startIndex = 0, onClose, albumTitle }) {
  const [index, setIndex] = useState(startIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [origin, setOrigin] = useState('center center');

  const dialogRef = useRef(null);
  const touchStart = useRef(null);
  const lastFocused = useRef(null);

  const total = photos.length;
  const photo = photos[index];

  useLockBodyScroll(true);

  const go = useCallback(
    (delta) => {
      setIsZoomed(false);
      setIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  // Precarga de vecinos: al llegar a una foto ya esta descargada la siguiente.
  // Se precarga con el mismo srcset que se va a mostrar, para que el navegador
  // reutilice el archivo del ancho que realmente necesita esta pantalla.
  useEffect(() => {
    [index + 1, index - 1].forEach((i) => {
      const neighbour = photos[(i + total) % total];
      if (!neighbour) return;
      const img = new Image();
      img.sizes = '100vw';
      if (neighbour.webp?.length) img.srcset = srcSetOf(neighbour.webp);
      img.src = neighbour.fallback;
    });
  }, [index, photos, total]);

  // Teclado y foco: al abrir enfocamos el dialogo y al cerrar devolvemos
  // el foco al elemento que lo abrio.
  useEffect(() => {
    lastFocused.current = document.activeElement;
    dialogRef.current?.focus();

    const onKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowRight':
          event.preventDefault();
          go(1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          go(-1);
          break;
        case 'Home':
          event.preventDefault();
          setIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setIndex(total - 1);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [go, onClose, total]);

  const onTouchStart = (event) => {
    if (isZoomed) return;
    const t = event.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (event) => {
    if (!touchStart.current || isZoomed) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    // Solo cuenta como swipe si el gesto fue mas horizontal que vertical
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    }
  };

  const toggleZoom = (event) => {
    if (isZoomed) {
      setIsZoomed(false);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
    setIsZoomed(true);
  };

  if (!photo) return null;

  const caption = photo.title || photo.alt || '';

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={albumTitle ? `Galería: ${albumTitle}` : 'Galería de fotos'}
      ref={dialogRef}
      tabIndex={-1}
      onClick={(event) => {
        // Clic en el fondo cierra; clic en la foto o los controles, no.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="lightbox__bar">
        <span className="lightbox__counter" aria-live="polite">
          {index + 1} / {total}
        </span>

        <div className="lightbox__actions">
          <button
            type="button"
            className="lightbox__btn"
            onClick={() => setIsZoomed((z) => !z)}
            aria-pressed={isZoomed}
            aria-label={isZoomed ? 'Alejar la foto' : 'Acercar la foto'}
          >
            <Icon name={isZoomed ? 'zoomOut' : 'zoomIn'} size={22} />
          </button>
          <button
            type="button"
            className="lightbox__btn"
            onClick={onClose}
            aria-label="Cerrar la galería"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
      </div>

      <button
        type="button"
        className="lightbox__nav lightbox__nav--prev"
        onClick={() => go(-1)}
        aria-label="Foto anterior"
      >
        <Icon name="chevronLeft" size={28} />
      </button>

      <figure
        className={`lightbox__stage ${isZoomed ? 'is-zoomed' : ''}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <picture key={photo.id || index}>
          {photo.avif?.length > 0 && (
            <source type="image/avif" srcSet={srcSetOf(photo.avif)} sizes="100vw" />
          )}
          {photo.webp?.length > 0 && (
            <source type="image/webp" srcSet={srcSetOf(photo.webp)} sizes="100vw" />
          )}
          <img
            src={photo.fallback}
            alt={photo.alt || caption || `Foto ${index + 1} de ${total}`}
            onClick={toggleZoom}
            style={{ transformOrigin: origin }}
            draggable={false}
          />
        </picture>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>

      <button
        type="button"
        className="lightbox__nav lightbox__nav--next"
        onClick={() => go(1)}
        aria-label="Foto siguiente"
      >
        <Icon name="chevronRight" size={28} />
      </button>
    </div>
  );
}
