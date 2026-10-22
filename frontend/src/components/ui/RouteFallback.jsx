import './RouteFallback.css';

/** Pantalla breve mientras se descarga el trozo de una ruta. */
export default function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback__spinner" />
      <span className="visually-hidden">Cargando</span>
    </div>
  );
}
