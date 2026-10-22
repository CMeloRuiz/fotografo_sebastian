import 'dotenv/config';

/**
 * Lee y valida la configuracion al arrancar.
 *
 * Preferimos fallar aqui, con un mensaje claro, que descubrir a mitad de una
 * peticion que falta una variable. Ningun secreto tiene valor por defecto.
 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia backend/.env.example a backend/.env y complétala.`,
    );
  }
  return value;
}

function optional(name, fallback = '') {
  return process.env[name] || fallback;
}

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  isProduction,
  port: Number(optional('PORT', '4000')),

  supabase: {
    url: required('SUPABASE_URL'),
    // La service_role key ignora RLS: nunca debe llegar al navegador.
    serviceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    bucket: optional('SUPABASE_STORAGE_BUCKET', 'photos'),
  },

  auth: {
    jwtSecret: required('JWT_SECRET'),
    // Sesion larga a proposito: el fotografo entra desde el celular y no
    // queremos que tenga que escribir la contrasena cada vez.
    tokenTtl: optional('JWT_TTL', '7d'),
    cookieName: 'ss_session',
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000,
  },

  cors: {
    // Lista blanca separada por comas
    origins: optional('CORS_ORIGINS', 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  mail: {
    // Si no hay SMTP configurado, el formulario sigue guardando en la base
    // de datos y solo se omite el correo.
    host: optional('SMTP_HOST'),
    port: Number(optional('SMTP_PORT', '587')),
    user: optional('SMTP_USER'),
    pass: optional('SMTP_PASS'),
    from: optional('MAIL_FROM', 'Sitio web <no-reply@sebastiansisa.com>'),
    to: optional('MAIL_TO'),
  },

  uploads: {
    maxFileBytes: Number(optional('MAX_UPLOAD_MB', '25')) * 1024 * 1024,
    maxFiles: Number(optional('MAX_UPLOAD_FILES', '20')),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff'],
  },

  siteUrl: optional('SITE_URL', 'http://localhost:5173'),
};

export default config;
