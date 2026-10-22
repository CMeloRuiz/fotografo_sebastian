import Icon from './Icon';
import './DemoNotice.css';

/**
 * Aviso de contenido de ejemplo.
 *
 * Deja claro, tanto al fotografo como a quien vea la propuesta, que esas
 * imagenes no son trabajo real suyo y que se reemplazan desde el panel.
 */
export default function DemoNotice({
  children = 'Imágenes de ejemplo. El fotógrafo las reemplaza por su trabajo real desde el panel.',
}) {
  return (
    <p className="demo-notice">
      <Icon name="spark" size={16} />
      <span>{children}</span>
    </p>
  );
}
