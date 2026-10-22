import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import config from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { ensureBucket } from './services/storage.js';

const app = express();

// Render y Nginx actuan de proxy: sin esto, el rate limit veria la IP del
// proxy para todo el mundo y bloquearia a todos a la vez.
app.set('trust proxy', 1);

app.use(
  helmet({
    // La API solo devuelve JSON; la CSP del sitio la pone el servidor web.
    contentSecurityPolicy: false,
    // Las fotos del storage se incrustan desde otro origen
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      // Sin origin son peticiones del propio servidor o de curl
      if (!origin || config.cors.origins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origen no permitido: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await ensureBucket();
  } catch (err) {
    // Que falte el bucket no debe impedir arrancar: el sitio publico sigue
    // funcionando y solo fallarian las subidas.
    console.error('[storage] no se pudo verificar el bucket:', err.message);
  }

  app.listen(config.port, () => {
    console.log(`API escuchando en http://localhost:${config.port}`);
    console.log(`Orígenes permitidos: ${config.cors.origins.join(', ')}`);
  });
}

start();

export default app;
