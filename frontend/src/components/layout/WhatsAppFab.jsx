import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import './WhatsAppFab.css';

/**
 * Boton flotante de WhatsApp.
 *
 * Aparece despues del primer scroll para no competir con el hero, y en
 * escritorio despliega la etiqueta al pasar el cursor.
 */
export default function WhatsAppFab({ href }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!href) return null;

  return (
    <a
      className={`wa-fab ${isVisible ? 'is-visible' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Cotizar por WhatsApp"
    >
      <Icon name="whatsapp" size={26} />
      <span className="wa-fab__label">Cotizar por WhatsApp</span>
    </a>
  );
}
