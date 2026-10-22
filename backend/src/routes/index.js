import { Router } from 'express';
import { z } from 'zod';

import asyncHandler from '../lib/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import handleUpload from '../middleware/upload.js';
import { loginLimiter, contactLimiter } from '../middleware/rateLimit.js';

import * as publicCtrl from '../controllers/public.controller.js';
import * as auth from '../controllers/auth.controller.js';
import * as albums from '../controllers/albums.controller.js';
import * as photos from '../controllers/photos.controller.js';
import * as content from '../controllers/content.controller.js';
import * as messages from '../controllers/messages.controller.js';

const router = Router();

// ── Salud ───────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ ok: true, at: new Date().toISOString() }));

// ── API publica (solo lectura) ──────────────────────────────
router.get('/content', asyncHandler(publicCtrl.getContent));
router.get('/albums', asyncHandler(publicCtrl.listAlbums));
router.get('/albums/:slug', asyncHandler(publicCtrl.getAlbum));

router.post(
  '/contact',
  contactLimiter,
  validate(messages.contactSchema),
  asyncHandler(messages.submit),
);

// ── Sesion ──────────────────────────────────────────────────
router.post('/auth/login', loginLimiter, validate(auth.loginSchema), asyncHandler(auth.login));
router.post('/auth/logout', asyncHandler(auth.logout));
router.get('/auth/me', requireAuth, asyncHandler(auth.me));
router.post(
  '/auth/password',
  requireAuth,
  validate(auth.changePasswordSchema),
  asyncHandler(auth.changePassword),
);

// ── Panel de administracion ─────────────────────────────────
// Todo lo que cuelga de /admin exige sesion.
const admin = Router();
admin.use(requireAuth);

admin.get('/stats', asyncHandler(messages.stats));

// Albumes
admin.get('/albums', asyncHandler(albums.list));
admin.post('/albums', validate(albums.createAlbumSchema), asyncHandler(albums.create));
admin.put('/albums/reorder', validate(albums.reorderSchema), asyncHandler(albums.reorder));
admin.get('/albums/:id', asyncHandler(albums.getOne));
admin.patch('/albums/:id', validate(albums.updateAlbumSchema), asyncHandler(albums.update));
admin.delete('/albums/:id', asyncHandler(albums.remove));

// Fotos
admin.post('/albums/:id/photos', handleUpload, asyncHandler(photos.upload));
admin.put('/photos/reorder', validate(photos.reorderPhotosSchema), asyncHandler(photos.reorder));
admin.post('/photos/delete', validate(photos.deleteManySchema), asyncHandler(photos.removeMany));
admin.patch('/photos/:id', validate(photos.updatePhotoSchema), asyncHandler(photos.update));
admin.post('/photos/:id/cover', asyncHandler(photos.setCover));
admin.post(
  '/photos/:id/transform',
  validate(photos.transformSchema),
  asyncHandler(photos.applyTransform),
);
admin.delete('/photos/:id', asyncHandler(photos.remove));

// Contenido, testimonios y servicios
admin.get('/content', asyncHandler(content.getAll));
admin.put('/content', validate(content.contentSchema), asyncHandler(content.setContent));
admin.post('/content/media/:key', handleUpload, asyncHandler(content.uploadMedia));

admin.post(
  '/testimonials',
  validate(content.testimonialSchema),
  asyncHandler(content.createTestimonial),
);
admin.put(
  '/testimonials/reorder',
  validate(content.reorderSchema),
  asyncHandler(content.reorderTestimonials),
);
admin.patch(
  '/testimonials/:id',
  validate(content.testimonialSchema.partial()),
  asyncHandler(content.updateTestimonial),
);
admin.delete('/testimonials/:id', asyncHandler(content.deleteTestimonial));

admin.patch(
  '/services/:id',
  validate(content.serviceSchema.partial()),
  asyncHandler(content.updateService),
);

// Mensajes recibidos
admin.get(
  '/messages',
  validate(z.object({ status: z.enum(['nuevo', 'respondido', 'archivado']).optional() }), 'query'),
  asyncHandler(messages.list),
);
admin.patch(
  '/messages/:id',
  validate(messages.statusSchema),
  asyncHandler(messages.updateStatus),
);
admin.delete('/messages/:id', asyncHandler(messages.remove));

router.use('/admin', admin);

export default router;
