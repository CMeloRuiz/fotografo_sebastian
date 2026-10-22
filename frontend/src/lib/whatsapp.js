/**
 * Arma el enlace de WhatsApp con el mensaje ya escrito, para que el cliente
 * solo tenga que pulsar enviar. Es el camino de conversion principal del
 * sitio, asi que vive en un solo lugar.
 */
export function whatsappLink(number, message) {
  const digits = String(number || '').replace(/[^0-9]/g, '');
  if (!digits) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export default whatsappLink;
