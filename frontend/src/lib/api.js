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

/**
 * Subida con barra de progreso.
 *
 * fetch() no informa del avance de la subida, y para el fotografo mandando
 * 20 fotos desde el celular esa barra es la diferencia entre esperar
 * tranquilo y pensar que la aplicacion se colgo. Por eso aqui, y solo aqui,
 * usamos XMLHttpRequest.
 */
export function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    if (!BASE) {
      reject(new ApiError('No hay backend configurado', 0, null));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}${path}`);
    xhr.withCredentials = true;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = xhr.responseText;
      }

      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(data?.error || `Error ${xhr.status}`, xhr.status, data));
    });

    xhr.addEventListener('error', () =>
      reject(new ApiError('No hay conexión con el servidor.', 0, null)),
    );
    xhr.addEventListener('abort', () => reject(new ApiError('Subida cancelada.', 0, null)));

    xhr.send(formData);
  });
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default api;
