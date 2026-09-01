import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { prisma } from './db/prisma.js';
import authRoutes from './routes/auth.js';
import drinksRoutes from './routes/drinks.js';
import modifiersRoutes from './routes/modifiers.js';
import ordersRoutes from './routes/orders.js';
import statsRoutes from './routes/stats.js';
import pushRoutes from './routes/push.js';
import { setCsrfToken } from './middleware/auth.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: config.isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
          },
        }
      : false,
  }),
);

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/drinks', drinksRoutes);
app.use('/api/modifiers', modifiersRoutes);
app.use('/api/orders', orderLimiter, ordersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/push', pushRoutes);

// CSRF token for all clients on first API hit
app.use('/api', (_req, res, next) => {
  if (!_req.cookies?.csrf_token) setCsrfToken(res);
  next();
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
  if (config.vapid.publicKey && config.vapid.privateKey) {
    console.log('Push notifications: VAPID configured');
  } else {
    console.log('Push notifications: disabled (no VAPID keys)');
  }
});

export default app;
