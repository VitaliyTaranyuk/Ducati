import { Router } from 'express';
import { isPrismaUniqueViolation, prisma } from '../db/prisma.js';
import { createModifierSchema, updateModifierSchema } from '../schemas/index.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate, csrfProtection, requireRole } from '../middleware/auth.js';

const router = Router();

function serializeModifier(mod: { id: string; name: string; price: unknown; isActive: boolean; sortOrder: number }) {
  return { ...mod, price: Number(mod.price) };
}

router.get('/', async (_req, res) => {
  const modifiers = await prisma.modifier.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  res.json({ modifiers: modifiers.map(serializeModifier) });
});

router.get('/admin/all', authenticate, requireRole('owner'), async (_req, res) => {
  const modifiers = await prisma.modifier.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  res.json({ modifiers: modifiers.map(serializeModifier) });
});

router.post(
  '/',
  authenticate,
  requireRole('owner'),
  csrfProtection,
  validateBody(createModifierSchema),
  async (req, res, next) => {
    try {
      const modifier = await prisma.modifier.create({ data: req.body });
      res.status(201).json({ modifier: serializeModifier(modifier) });
    } catch (err) {
      if (isPrismaUniqueViolation(err)) {
        return res.status(409).json({ error: 'Доп с таким названием уже существует' });
      }
      next(err);
    }
  },
);

router.put(
  '/:id',
  authenticate,
  requireRole('owner'),
  csrfProtection,
  validateBody(updateModifierSchema),
  async (req, res, next) => {
    try {
      const modifier = await prisma.modifier.update({
        where: { id: req.params.id as string },
        data: req.body,
      });
      res.json({ modifier: serializeModifier(modifier) });
    } catch (err) {
      if (isPrismaUniqueViolation(err)) {
        return res.status(409).json({ error: 'Доп с таким названием уже существует' });
      }
      next(err);
    }
  },
);

router.delete(
  '/:id',
  authenticate,
  requireRole('owner'),
  csrfProtection,
  async (req, res) => {
    await prisma.modifier.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    res.json({ ok: true });
  },
);

export default router;
