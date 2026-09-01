import { Router } from 'express';
import { loginSchema, createUserSchema } from '../schemas/index.js';
import { validateBody } from '../middleware/validate.js';
import {
  authenticate,
  clearAuthCookies,
  csrfProtection,
  requireRole,
  setAuthCookies,
  setCsrfToken,
  type AuthRequest,
} from '../middleware/auth.js';
import { createUser, loginUser, logoutUser, refreshSession } from '../services/auth.js';
import { getVapidPublicKey } from '../services/push.js';

const router = Router();

router.get('/csrf', (_req, res) => {
  const token = setCsrfToken(res);
  res.json({ csrfToken: token });
});

router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const result = await loginUser(req.body.email, req.body.password);
  if (!result) return res.status(401).json({ error: 'Invalid credentials' });

  setAuthCookies(res, result.accessToken, result.refreshToken);
  setCsrfToken(res);
  res.json({
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      name: result.user.name,
    },
  });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  const result = await refreshSession(refreshToken);
  if (!result) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.json({
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      name: result.user.name,
    },
  });
});

router.post('/logout', csrfProtection, async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) await logoutUser(refreshToken);
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.post(
  '/users',
  authenticate,
  requireRole('owner'),
  csrfProtection,
  validateBody(createUserSchema),
  async (req: AuthRequest, res) => {
    try {
      const user = await createUser(req.body);
      res.status(201).json({ user });
    } catch {
      res.status(409).json({ error: 'Email already exists' });
    }
  },
);

export default router;
