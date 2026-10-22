/**
 * Cliente de la API.
 *
 * VITE_API_URL vacio significa "sin backend": el sitio se sirve con el
 * contenido estatico incluido en el bundle. Asi el frontend se puede
 * desplegar y revisar aunque el backend todavia no este arriba.
 */
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const hasBackend = Boolean(BASE);

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function request(path, { method = 'GET', body, signal, headers = {} } = {}) {
  if (!BASE) throw new ApiError('No hay backend configurado', 0, null);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(`${BASE}${path}`, {
    method,
    signal,
    // La sesion del admin viaja en una cookie httpOnly
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Error ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default api;
