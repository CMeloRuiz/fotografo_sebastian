import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Sesion del administrador.
 *
 * El token viaja en una cookie httpOnly: no es accesible desde JavaScript,
 * asi que un XSS en el sitio no puede robarla. SameSite protege del CSRF en
 * los navegadores actuales.
 */

export function issueSession(res, admin) {
  const token = jwt.sign({ sub: admin.id, email: admin.email }, config.auth.jwtSecret, {
    expiresIn: config.auth.tokenTtl,
  });

  res.cookie(config.auth.cookieName, token, { ...cookieOptions(), maxAge: config.auth.cookieMaxAge });

  return token;
}

/**
 * Las mismas opciones al poner y al borrar la cookie.
 *
 * El navegador solo borra una cookie si las opciones coinciden con las que
 * tenia. Si esto se duplica y un dia cambia en un sitio y no en el otro,
 * cerrar sesion deja de funcionar y no se nota hasta que alguien lo prueba.
 */
function cookieOptions() {
  const sameSite = config.isProduction ? config.auth.cookieSameSite : 'lax';

  return {
    httpOnly: true,
    // SameSite=None sin Secure la rechazan todos los navegadores.
    secure: config.isProduction || sameSite === 'none',
    sameSite,
    path: '/',
  };
}

export function clearSession(res) {
  res.clearCookie(config.auth.cookieName, cookieOptions());
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[config.auth.cookieName];

  if (!token) {
    return res.status(401).json({ error: 'Necesitas iniciar sesión.' });
  }

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    req.admin = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    clearSession(res);
    return res.status(401).json({ error: 'Tu sesión expiró. Vuelve a iniciar sesión.' });
  }
}

export default { issueSession, clearSession, requireAuth };
