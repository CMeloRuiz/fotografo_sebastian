import multer from 'multer';
import config from '../config/env.js';

/**
 * Recepcion de archivos en memoria.
 *
 * No se escriben a disco: sharp los procesa y el resultado va directo al
 * storage. Limites de tamano, cantidad y tipo antes de tocar nada.
 */
export const uploadPhotos = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.uploads.maxFileBytes,
    files: config.uploads.maxFiles,
  },
  fileFilter(req, file, cb) {
    if (!config.uploads.allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error(`Formato no admitido: ${file.mimetype}. Usa JPG, PNG o WebP.`));
      return;
    }
    cb(null, true);
  },
}).array('photos', config.uploads.maxFiles);

/** Envuelve multer para traducir sus errores a mensajes en español. */
export function handleUpload(req, res, next) {
  uploadPhotos(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      const mb = Math.round(config.uploads.maxFileBytes / 1024 / 1024);
      return res.status(413).json({ error: `Cada foto debe pesar menos de ${mb} MB.` });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res
        .status(413)
        .json({ error: `Puedes subir hasta ${config.uploads.maxFiles} fotos a la vez.` });
    }
    return res.status(400).json({ error: err.message });
  });
}

export default handleUpload;
