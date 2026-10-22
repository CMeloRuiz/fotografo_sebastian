import rateLimit from 'express-rate-limit';

/** Login: freno a la fuerza bruta sobre la contraseña del fotógrafo. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Los intentos correctos no gastan cuota: solo penalizamos los fallidos.
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.' },
});

/** Formulario de contacto: evita que lo usen como buzón de spam. */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Has enviado varios mensajes seguidos. Espera un momento o escríbeme por WhatsApp.',
  },
});

/** Límite general, suave, para el resto de la API. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export default { loginLimiter, contactLimiter, apiLimiter };
