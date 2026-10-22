import { useCallback, useEffect, useRef, useState } from 'react';
import './Sortable.css';

/**
 * Reordenar arrastrando, sin dependencias.
 *
 * Usa eventos de puntero en vez de la API de drag & drop del navegador
 * porque esa no funciona con el dedo, y el fotografo va a usar el panel
 * desde el celular casi siempre. Con pointer events el mismo codigo sirve
 * para raton, dedo y lapiz.
 *
 * El arrastre empieza solo desde el tirador (handleProps), para que
 * desplazar la pagina con el dedo siga funcionando con normalidad.
 */
export default function Sortable({ items, onReorder, renderItem, className = '', getId = (i) => i.id }) {
  const [order, setOrder] = useState(() => items.map(getId));
  const [draggingId, setDraggingId] = useState(null);

  const nodes = useRef(new Map());
  const startOrder = useRef(null);

  // Si la lista cambia desde fuera (se agrega o borra algo), nos resincronizamos.
  useEffect(() => {
    if (draggingId) return;
    setOrder(items.map(getId));
  }, [items, draggingId, getId]);

  const byId = new Map(items.map((item) => [getId(item), item]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean);

  /** Indice del elemento cuyo centro esta mas cerca del puntero. */
  const indexAtPoint = useCallback(
    (x, y) => {
      let closest = -1;
      let best = Infinity;

      order.forEach((id, index) => {
        const node = nodes.current.get(id);
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const dx = x - (rect.left + rect.width / 2);
        const dy = y - (rect.top + rect.height / 2);
        const distance = dx * dx + dy * dy;
        if (distance < best) {
          best = distance;
          closest = index;
        }
      });

      return closest;
    },
    [order],
  );

  const onPointerDown = (id) => (event) => {
    // Solo boton principal; ignoramos clic derecho y similares
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();

    startOrder.current = order;
    setDraggingId(id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!draggingId) return;

    const from = order.indexOf(draggingId);
    const to = indexAtPoint(event.clientX, event.clientY);
    if (to === -1 || to === from) return;

    setOrder((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const endDrag = () => {
    if (!draggingId) return;

    const changed =
      startOrder.current && startOrder.current.join() !== order.join();

    setDraggingId(null);
    startOrder.current = null;

    if (changed) onReorder(order);
  };

  return (
    <div
      className={`sortable ${draggingId ? 'is-dragging' : ''} ${className}`}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {ordered.map((item, index) => {
        const id = getId(item);
        return (
          <div
            key={id}
            ref={(node) => {
              if (node) nodes.current.set(id, node);
              else nodes.current.delete(id);
            }}
            className={`sortable__item ${draggingId === id ? 'is-active' : ''}`}
          >
            {renderItem(item, {
              index,
              isDragging: draggingId === id,
              handleProps: {
                onPointerDown: onPointerDown(id),
                className: 'sortable__handle',
                'aria-label': 'Arrastrar para reordenar',
                title: 'Arrastrar para reordenar',
              },
            })}
          </div>
        );
      })}
    </div>
  );
}
