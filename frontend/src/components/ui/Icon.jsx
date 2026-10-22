/**
 * Iconos en SVG inline.
 *
 * El sitio antiguo cargaba Font Awesome completo desde un CDN (unos 80 KB de
 * CSS mas los archivos de fuente) para pintar diez iconos. Estos van en el
 * bundle, no bloquean el render y heredan el color del texto.
 */

const PATHS = {
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  video: 'M23 7l-7 5 7 5zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
  portrait: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  building: 'M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2',
  check: 'M20 6L9 17l-5-5',
  close: 'M18 6L6 18M6 6l12 12',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  zoomIn: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3M11 8v6M8 11h6',
  zoomOut: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3M8 11h6',
  filter: 'M22 3H2l8 9.5V19l4 2v-8.5z',
  instagram:
    'M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01',
  facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  youtube:
    'M22.5 7.4a2.8 2.8 0 0 0-2-2C18.8 5 12 5 12 5s-6.8 0-8.5.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1.2 12a29 29 0 0 0 .3 4.6 2.8 2.8 0 0 0 2 2C5.2 19 12 19 12 19s6.8 0 8.5-.4a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .3-4.6 29 29 0 0 0-.3-4.6zM9.8 15.1V8.9l5.7 3.1z',
  tiktok:
    'M21 8.3a6.8 6.8 0 0 1-4.5-1.7v7.6a5.9 5.9 0 1 1-5.1-5.8v3a2.9 2.9 0 1 0 2 2.8V2h3a4.8 4.8 0 0 0 4.6 4.3z',
  whatsapp:
    'M20.5 3.5A10.4 10.4 0 0 0 3.6 16.1L2 22l6.1-1.6a10.4 10.4 0 0 0 12.4-16.9zM12 20.1a8.6 8.6 0 0 1-4.4-1.2l-.3-.2-3.6 1 1-3.5-.2-.3A8.6 8.6 0 1 1 12 20.1zm4.7-6.4c-.3-.1-1.5-.8-1.8-.9s-.4-.1-.6.1-.6.8-.8 1-.3.2-.6 0a7 7 0 0 1-2-1.3 7.8 7.8 0 0 1-1.5-1.8c-.1-.3 0-.4.1-.6l.4-.5.3-.5v-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4H8c-.2 0-.5.1-.8.4a3.2 3.2 0 0 0-1 2.4 5.6 5.6 0 0 0 1.2 3 12.7 12.7 0 0 0 4.8 4.2c.7.3 1.2.5 1.6.6a3.9 3.9 0 0 0 1.8.1 2.9 2.9 0 0 0 1.9-1.4 2.4 2.4 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z',
  menu: 'M3 12h18M3 6h18M3 18h18',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  spark: 'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z',
  award: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.2 13.9L7 23l5-3 5 3-1.2-9.1',
  heart: 'M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z',
  images: 'M9 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 5h18v14H3zM3 17l5-5 4 4 3-3 6 6',
};

const FILLED = new Set(['instagram', 'facebook', 'youtube', 'tiktok', 'whatsapp']);

export default function Icon({ name, size = 20, className = '', ...rest }) {
  const d = PATHS[name];
  if (!d) return null;

  // Las marcas se ven mal como trazo; el resto son iconos de linea.
  const isFilled = FILLED.has(name) && name !== 'instagram';

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke={isFilled ? 'none' : 'currentColor'}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
