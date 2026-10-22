import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import useSeo from '../hooks/useSeo';
import './NotFound.css';

export default function NotFound() {
  useSeo({
    title: 'Página no encontrada',
    description: 'La página que buscas no existe o cambió de dirección.',
  });

  return (
    <section className="notfound">
      <div className="container">
        <p className="eyebrow">Error 404</p>
        <h1>Esta toma no salió</h1>
        <p className="lead">
          La página que buscas no existe o cambió de dirección. Desde aquí puedes volver al
          inicio o ir directo al portafolio.
        </p>
        <div className="notfound__actions">
          <Link to="/" className="btn btn--primary">
            Volver al inicio
          </Link>
          <Link to="/portafolio" className="btn btn--ghost">
            Ver portafolio
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
