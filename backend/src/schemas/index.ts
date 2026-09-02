import { z } from 'zod';
import { isValidReadyAt, readyAtErrorMessage } from '../lib/readyAt.js';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['barista', 'owner']),
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
});

export const drinkCategorySchema = z.enum(['classics', 'special', 'ice']);

export const drinkSizeSchema = z.object({
  size: z.enum(['S', 'M', 'L']),
  price: z.number().positive(),
  volumeMl: z.number().int().positive(),
});

/** Full http(s) URL or a site-root path such as /drinks/latte.jpg */
export const imageUrlSchema = z
  .string()
  .max(500)
  .refine(
    (v) =>
      v === '' ||
      (v.startsWith('/') && !v.startsWith('//')) ||
      /^https?:\/\//i.test(v),
    { message: 'imageUrl must be an http(s) URL or a root-relative path' },
  );

export const createDrinkSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: imageUrlSchema.optional(),
  sortOrder: z.number().int().optional(),
  category: drinkCategorySchema.optional(),
  badge: z.string().max(20).nullable().optional(),
  flavorOptions: z.array(z.string().min(1).max(80)).max(20).optional(),
  flavorPrices: z
    .record(
      z.string().min(1).max(80),
      z.object({
        S: z.number().positive().optional(),
        M: z.number().positive().optional(),
        L: z.number().positive().optional(),
      }),
    )
    .optional(),
  excludedModifierNames: z.array(z.string().min(1).max(80)).max(20).optional(),
  sizes: z.array(drinkSizeSchema).min(1),
});

export const updateDrinkSchema = createDrinkSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const drinksQuerySchema = z.object({
  category: drinkCategorySchema.optional(),
});

export const createModifierSchema = z.object({
  name: z.string().min(1).max(80),
  price: z.number().nonnegative(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateModifierSchema = createModifierSchema.partial();

export const orderItemSchema = z.object({
  drinkId: z.string().uuid(),
  size: z.enum(['S', 'M', 'L']),
  quantity: z.number().int().min(1).max(20),
  flavor: z.string().min(1).max(80).optional(),
  syrup: z.string().min(1).max(80).optional(),
  modifiers: z
    .array(z.object({ modifierId: z.string().uuid() }))
    .max(10)
    .optional(),
});

export const createOrderSchema = z
  .object({
    customerName: z.string().min(1).max(100),
    customerPhone: z.string().min(5).max(20),
    comment: z.string().max(500).optional(),
    readyAt: z.string().datetime(),
    items: z.array(orderItemSchema).min(1),
    clientId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (!isValidReadyAt(new Date(data.readyAt))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['readyAt'],
        message: readyAtErrorMessage(),
      });
    }
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(['preparing', 'ready', 'cancelled', 'completed']),
});

export const orderQuerySchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'cancelled', 'completed', 'all']).optional(),
});

export const statsQuerySchema = z.object({
  period: z.enum(['day', 'week']).default('day'),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const historyQuerySchema = z.object({
  phone: z.string().min(5).max(20),
});
