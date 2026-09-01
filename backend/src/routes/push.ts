import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { pushSubscribeSchema } from '../schemas/index.js';
import { validateBody } from '../middleware/validate.js';
import {
  authenticate,
  csrfProtection,
  requireRole,
  type AuthRequest,
} from '../middleware/auth.js';

const router = Router();

router.post(
  '/subscribe',
  authenticate,
  requireRole('barista', 'owner'),
  csrfProtection,
  validateBody(pushSubscribeSchema),
  async (req: AuthRequest, res) => {
    const { endpoint, keys } = req.body;
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: req.user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        userId: req.user!.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });
    res.json({ ok: true });
  },
);

router.delete('/unsubscribe', authenticate, csrfProtection, async (req: AuthRequest, res) => {
  const endpoint = req.body?.endpoint as string | undefined;
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user!.id } });
  }
  res.json({ ok: true });
});

export default router;
