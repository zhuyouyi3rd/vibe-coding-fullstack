import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { api } from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, '../../web/dist');

export const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'https:', 'http:'],
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === env.clientOrigin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

if (fs.existsSync(path.join(webDist, 'index.html'))) {
  app.use(express.static(webDist));
}

app.use('/api', api);

if (fs.existsSync(path.join(webDist, 'index.html'))) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(webDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ name: '问渠问答 API', version: '1.0.0' });
  });
}

app.use(notFound);
app.use(errorHandler);
