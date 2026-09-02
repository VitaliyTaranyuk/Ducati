import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
  historyQuerySchema,
} from '../schemas/index.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  authenticate,
  csrfProtection,
  optionalAuth,
  requireRole,
  type AuthRequest,
} from '../middleware/auth.js';
import { sendPushToBaristas } from '../services/push.js';
import { isSyrupName, SYRUP_MODIFIER_NAME } from '../lib/syrups.js';
import { flavorSizePrice } from '../lib/flavorPrices.js';
import type { DrinkSize, OrderStatus } from '@prisma/client';

const router = Router();

const orderItemInclude = { modifiers: true } as const;

function serializeOrder(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  comment: string | null;
  status: OrderStatus;
  readyAt: Date;
  total: unknown;
  createdAt: Date;
  items: {
    id: string;
    drinkId: string;
    drinkName: string;
    size: DrinkSize;
    volumeMl: number;
    flavor: string | null;
    syrup: string | null;
    quantity: number;
    unitPrice: unknown;
    subtotal: unknown;
    modifiers: { id: string; modifierId: string; name: string; price: unknown }[];
  }[];
}) {
  return {
    ...order,
    total: Number(order.total),
    items: order.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal),
      modifiers: i.modifiers.map((m) => ({
        ...m,
        price: Number(m.price),
      })),
    })),
  };
}

router.post('/', optionalAuth, validateBody(createOrderSchema), async (req: AuthRequest, res) => {
  const { items, readyAt, customerName, customerPhone, comment, clientId } = req.body as {
    items: {
      drinkId: string;
      size: DrinkSize;
      quantity: number;
      flavor?: string;
      syrup?: string;
      modifiers?: { modifierId: string }[];
    }[];
    readyAt: string;
    customerName: string;
    customerPhone: string;
    comment?: string;
    clientId?: string;
  };

  const drinkIds = [...new Set(items.map((i) => i.drinkId))];
  const drinks = await prisma.drink.findMany({
    where: { id: { in: drinkIds }, isActive: true },
    include: { sizes: true },
  });

  if (drinks.length !== drinkIds.length) {
    return res.status(400).json({ error: 'Invalid drink in order' });
  }

  const modifierIds = [...new Set(items.flatMap((i) => (i.modifiers ?? []).map((m) => m.modifierId)))];
  const modifiers =
    modifierIds.length > 0
      ? await prisma.modifier.findMany({
          where: { id: { in: modifierIds }, isActive: true },
        })
      : [];

  if (modifiers.length !== modifierIds.length) {
    return res.status(400).json({ error: 'Invalid modifier in order' });
  }

  const drinkMap = new Map(drinks.map((d) => [d.id, d]));
  const modifierMap = new Map(modifiers.map((m) => [m.id, m]));
  const syrupCatalog = await prisma.modifier.findFirst({
    where: { name: SYRUP_MODIFIER_NAME, isActive: true },
  });
  const syrupCharge = syrupCatalog ? Number(syrupCatalog.price) : 40;
  let total = 0;
  const orderItems: {
    drinkId: string;
    drinkName: string;
    size: DrinkSize;
    volumeMl: number;
    flavor: string | null;
    syrup: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    modifiers: { modifierId: string; name: string; price: number }[];
  }[] = [];

  for (const item of items) {
    const drink = drinkMap.get(item.drinkId)!;
    const sizeOption = drink.sizes.find((s) => s.size === item.size);
    if (!sizeOption) {
      return res.status(400).json({ error: `Size ${item.size} not available for ${drink.name}` });
    }

    if (item.flavor) {
      if (drink.flavorOptions.length > 0 && !drink.flavorOptions.includes(item.flavor)) {
        return res.status(400).json({ error: `Flavor ${item.flavor} not available for ${drink.name}` });
      }
    }

    let syrup: string | null = item.syrup ?? null;
    if (syrup && !isSyrupName(syrup)) {
      return res.status(400).json({ error: `Сироп «${syrup}» недоступен` });
    }

    const uniqueModIds = [...new Set((item.modifiers ?? []).map((m) => m.modifierId))];
    const blocked = new Set(drink.excludedModifierNames ?? []);
    for (const id of uniqueModIds) {
      const mod = modifierMap.get(id)!;
      if (blocked.has(mod.name)) {
        return res.status(400).json({ error: `Доп «${mod.name}» недоступен для ${drink.name}` });
      }
    }
    const itemMods = uniqueModIds
      .map((id) => {
        const mod = modifierMap.get(id)!;
        return { modifierId: mod.id, name: mod.name, price: Number(mod.price) };
      })
      .filter((m) => m.name !== SYRUP_MODIFIER_NAME);

    let extras = itemMods.reduce((sum, m) => sum + m.price, 0);
    if (syrup && drink.category !== 'ice') {
      extras += syrupCharge;
    }
    const unitPrice = flavorSizePrice(drink.flavorPrices, item.flavor, item.size) ?? Number(sizeOption.price);
    const subtotal = (unitPrice + extras) * item.quantity;
    total += subtotal;
    orderItems.push({
      drinkId: drink.id,
      drinkName: drink.name,
      size: item.size,
      volumeMl: sizeOption.volumeMl,
      flavor: item.flavor ?? null,
      syrup,
      quantity: item.quantity,
      unitPrice,
      subtotal,
      modifiers: itemMods,
    });
  }

  const order = await prisma.order.create({
    data: {
      customerName,
      customerPhone,
      comment: comment ?? null,
      readyAt: new Date(readyAt),
      total,
      userId: req.user?.id ?? null,
      items: {
        create: orderItems.map((item) => ({
          drinkId: item.drinkId,
          drinkName: item.drinkName,
          size: item.size,
          volumeMl: item.volumeMl,
          flavor: item.flavor,
          syrup: item.syrup,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          modifiers: { create: item.modifiers },
        })),
      },
    },
    include: { items: { include: orderItemInclude } },
  });

  sendPushToBaristas({
    title: 'Новый заказ',
    body: `${customerName}: ${orderItems.length} поз. на ${new Date(readyAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
    url: '/barista',
  }).catch(() => {});

  res.status(201).json({ order: serializeOrder(order), clientId });
});

router.get(
  '/',
  authenticate,
  requireRole('barista', 'owner'),
  validateQuery(orderQuerySchema),
  async (req, res) => {
    const status = req.query.status as string | undefined;
    const where =
      status && status !== 'all' ? { status: status as OrderStatus } : {};

    const orders = await prisma.order.findMany({
      where: {
        ...where,
        status: status === 'all' || !status
          ? { notIn: ['completed', 'cancelled'] }
          : (where.status as OrderStatus),
      },
      include: { items: { include: orderItemInclude } },
      orderBy: { readyAt: 'asc' },
    });

    res.json({ orders: orders.map(serializeOrder) });
  },
);

router.get('/history', validateQuery(historyQuerySchema), async (req, res) => {
  const phone = req.query.phone as string;
  const orders = await prisma.order.findMany({
    where: { customerPhone: phone },
    include: { items: { include: orderItemInclude } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({ orders: orders.map(serializeOrder) });
});

router.patch(
  '/:id/status',
  authenticate,
  requireRole('barista', 'owner'),
  csrfProtection,
  validateBody(updateOrderStatusSchema),
  async (req, res) => {
    const order = await prisma.order.update({
      where: { id: req.params.id as string },
      data: { status: req.body.status },
      include: { items: { include: orderItemInclude } },
    });
    res.json({ order: serializeOrder(order) });
  },
);

export default router;
