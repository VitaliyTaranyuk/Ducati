import { Router } from 'express';
import type { DrinkCategory } from '@prisma/client';
import { isPrismaUniqueViolation, prisma } from '../db/prisma.js';
import { createDrinkSchema, drinksQuerySchema, updateDrinkSchema } from '../schemas/index.js';
import { parseFlavorPrices } from '../lib/flavorPrices.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  authenticate,
  csrfProtection,
  requireRole,
} from '../middleware/auth.js';

const router = Router();

function serializeDrink(drink: {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  category: DrinkCategory;
  badge: string | null;
  flavorOptions: string[];
  flavorPrices?: unknown;
  excludedModifierNames: string[];
  sizes: { id: string; size: string; price: unknown; volumeMl: number }[];
}) {
  return {
    ...drink,
    flavorPrices: parseFlavorPrices(drink.flavorPrices),
    sizes: drink.sizes.map((s) => ({
      ...s,
      price: Number(s.price),
    })),
  };
}

const drinkInclude = { sizes: { orderBy: { volumeMl: 'asc' as const } } };

// Public: list active drinks
router.get('/', validateQuery(drinksQuerySchema), async (req, res) => {
  const category = req.query.category as DrinkCategory | undefined;
  const drinks = await prisma.drink.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    include: drinkInclude,
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });

  const serialized = drinks.map(serializeDrink);
  const grouped = {
    classics: serialized.filter((d) => d.category === 'classics'),
    special: serialized.filter((d) => d.category === 'special'),
    ice: serialized.filter((d) => d.category === 'ice'),
  };

  res.json({ drinks: serialized, grouped, version: Date.now() });
});

// Owner: all drinks including inactive (must be before /:id)
router.get('/admin/all', authenticate, requireRole('owner'), async (_req, res) => {
  const drinks = await prisma.drink.findMany({
    include: drinkInclude,
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });
  res.json({ drinks: drinks.map(serializeDrink) });
});

router.get('/:id', async (req, res) => {
  const drink = await prisma.drink.findUnique({
    where: { id: req.params.id },
    include: drinkInclude,
  });
  if (!drink || !drink.isActive) return res.status(404).json({ error: 'Not found' });
  res.json({ drink: serializeDrink(drink) });
});

router.post(
  '/',
  authenticate,
  requireRole('owner'),
  csrfProtection,
  validateBody(createDrinkSchema),
  async (req, res, next) => {
    try {
      const { sizes, ...data } = req.body;
      const drink = await prisma.drink.create({
        data: {
          ...data,
          imageUrl: data.imageUrl || null,
          sizes: { create: sizes },
        },
        include: drinkInclude,
      });
      res.status(201).json({ drink: serializeDrink(drink) });
    } catch (err) {
      if (isPrismaUniqueViolation(err)) {
        return res.status(409).json({ error: 'Напиток с таким названием уже есть в этой категории' });
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
  validateBody(updateDrinkSchema),
  async (req, res, next) => {
    try {
      const { sizes, ...data } = req.body;
      const id = req.params.id as string;

      await prisma.$transaction(async (tx) => {
        await tx.drink.update({
          where: { id },
          data: { ...data, imageUrl: data.imageUrl === undefined ? undefined : data.imageUrl || null },
        });
        if (sizes) {
          await tx.drinkSizeOption.deleteMany({ where: { drinkId: id } });
          await tx.drinkSizeOption.createMany({
            data: sizes.map((s: { size: string; price: number; volumeMl: number }) => ({
              drinkId: id,
              ...s,
            })),
          });
        }
      });

      const drink = await prisma.drink.findUnique({
        where: { id },
        include: drinkInclude,
      });
      res.json({ drink: drink ? serializeDrink(drink) : null });
    } catch (err) {
      if (isPrismaUniqueViolation(err)) {
        return res.status(409).json({ error: 'Напиток с таким названием уже есть в этой категории' });
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
    await prisma.drink.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    res.json({ ok: true });
  },
);

export default router;
