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

  res.cookie(config.auth.cookieName, token, {
    httpOnly: true,
    // En produccion el panel y la API viven en dominios distintos (Render),
    // asi que la cookie tiene que ser SameSite=None, y eso exige Secure.
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: config.auth.cookieMaxAge,
    path: '/',
  });

  return token;
}

export function clearSession(res) {
  res.clearCookie(config.auth.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/',
  });
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
