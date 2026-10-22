import config from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

/**
 * Último recurso. Registra el error completo en el servidor y devuelve al
 * cliente un mensaje útil sin filtrar rutas internas ni trazas.
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    error:
      status >= 500
        ? 'Algo falló en el servidor. Inténtalo de nuevo en un momento.'
        : err.message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
}

export default { notFound, errorHandler };
