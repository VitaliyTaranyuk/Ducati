import { publicUrl } from '../lib/assets';
import type { Drink, DrinkSize, Modifier } from '../types';

function sizes(
  drinkId: string,
  rows: { size: DrinkSize; price: number; volumeMl: number }[],
): Drink['sizes'] {
  return rows.map((row) => ({ id: `${drinkId}-${row.size}`, ...row }));
}

function sml(drinkId: string, prices: { s?: number; m?: number; l?: number }): Drink['sizes'] {
  const rows: { size: DrinkSize; price: number; volumeMl: number }[] = [];
  if (prices.s != null) rows.push({ size: 'S', price: prices.s, volumeMl: 250 });
  if (prices.m != null) rows.push({ size: 'M', price: prices.m, volumeMl: 350 });
  if (prices.l != null) rows.push({ size: 'L', price: prices.l, volumeMl: 450 });
  return sizes(drinkId, rows);
}

/** Old card ids → grouped drink (bookmarks / cached carts). */
export const DRINK_ID_ALIASES: Record<string, string> = {
  'raf-cream': 'raf',
  'raf-signature': 'raf',
  'latte-pumpkin': 'latte',
};

export function resolveDrinkId(id: string): string {
  return DRINK_ID_ALIASES[id] ?? id;
}

/** Bundled menu for GitHub Pages and local preview without API. */
export const FALLBACK_MODIFIERS: Modifier[] = [
  { id: 'mod-syrup', name: 'Сироп', price: 40, isActive: true, sortOrder: 1 },
  { id: 'mod-alt-milk', name: 'Альтернативное молоко', price: 60, isActive: true, sortOrder: 2 },
];

export const FALLBACK_DRINKS: Drink[] = [
  {
    id: 'cappuccino',
    name: 'Капучино',
    description: 'Классический капучино или капучино крем',
    imageUrl: publicUrl('drinks/cappuccino.jpg'),
    isActive: true,
    sortOrder: 0,
    category: 'classics',
    badge: null,
    flavorOptions: ['Классический', 'Капучино крем'],
    flavorPrices: {
      Классический: { S: 140, M: 200, L: 270 },
      'Капучино крем': { S: 170, M: 250, L: 290 },
    },
    sizes: sml('cappuccino', { s: 140, m: 200, l: 270 }),
  },
  {
    id: 'raf',
    name: 'Раф',
    description: 'Сливочный раф на эспрессо и сливках. Классика или авторский вкус',
    imageUrl: publicUrl('drinks/raf.jpg'),
    isActive: true,
    sortOrder: 1,
    category: 'classics',
    badge: null,
    flavorOptions: ['Классика', 'Халва', 'Цитрус', 'Арахис', 'Медовик'],
    flavorPrices: {
      Классика: { S: 170, M: 250, L: 290 },
      Халва: { S: 200, M: 270, L: 320 },
      Цитрус: { S: 200, M: 270, L: 320 },
      Арахис: { S: 200, M: 270, L: 320 },
      Медовик: { S: 200, M: 270, L: 320 },
    },
    sizes: sml('raf', { s: 170, m: 250, l: 290 }),
  },
  {
    id: 'latte',
    name: 'Латте',
    description: 'Классический латте или сезонный — тыква и орхидея',
    imageUrl: publicUrl('drinks/latte.jpg'),
    isActive: true,
    sortOrder: 2,
    category: 'classics',
    badge: null,
    flavorOptions: ['Классический', 'Тыква', 'Орхидея'],
    flavorPrices: {
      Классический: { S: 140, M: 200, L: 270 },
      Тыква: { S: 190, M: 250, L: 290 },
      Орхидея: { S: 190, M: 250, L: 290 },
    },
    sizes: sml('latte', { s: 140, m: 200, l: 270 }),
  },
  {
    id: 'flat-white',
    name: 'Флэт Уайт',
    description: 'Двойной эспрессо и тонкий слой микропены',
    imageUrl: publicUrl('drinks/flat-white.jpg'),
    isActive: true,
    sortOrder: 3,
    category: 'classics',
    badge: null,
    flavorOptions: [],
    sizes: sml('flat-white', { s: 170, m: 240, l: 310 }),
  },
  {
    id: 'americano',
    name: 'Американо',
    description: 'Эспрессо с горячей водой',
    imageUrl: publicUrl('drinks/americano.jpg'),
    isActive: true,
    sortOrder: 4,
    category: 'classics',
    badge: null,
    flavorOptions: [],
    sizes: sml('americano', { s: 120, m: 170 }),
  },
  {
    id: 'espresso',
    name: 'Эспрессо',
    description: 'Классический эспрессо 36 мл',
    imageUrl: publicUrl('drinks/espresso.jpg'),
    isActive: true,
    sortOrder: 5,
    category: 'classics',
    badge: null,
    flavorOptions: [],
    sizes: sizes('espresso', [{ size: 'S', price: 120, volumeMl: 36 }]),
  },
  {
    id: 'matcha-green',
    name: 'Матча GREEN',
    description: 'Японская матча на молоке',
    imageUrl: publicUrl('drinks/matcha.jpg'),
    isActive: true,
    sortOrder: 6,
    category: 'classics',
    badge: null,
    flavorOptions: [],
    sizes: sml('matcha-green', { s: 190, m: 250, l: 290 }),
  },
  {
    id: 'cheese-raf',
    name: 'Сырный раф',
    description: 'Раф с сырным кремом',
    imageUrl: publicUrl('drinks/cheese-raf.jpg'),
    isActive: true,
    sortOrder: 7,
    category: 'classics',
    badge: 'NEW',
    flavorOptions: [],
    sizes: sml('cheese-raf', { s: 230, m: 300, l: 350 }),
  },
  {
    id: 'hot-chocolate',
    name: 'Горячий шоколад / Какао',
    description: 'Густой горячий шоколад или классическое какао',
    imageUrl: publicUrl('drinks/hot-chocolate.jpg'),
    isActive: true,
    sortOrder: 8,
    category: 'classics',
    badge: null,
    flavorOptions: ['Горячий шоколад', 'Какао'],
    sizes: sml('hot-chocolate', { s: 190, m: 260, l: 310 }),
  },
  {
    id: 'tea',
    name: 'Чай',
    description: 'Яркий аромат, мягкая терпкость, чистое послевкусие',
    imageUrl: publicUrl('drinks/tea.jpg'),
    isActive: true,
    sortOrder: 9,
    category: 'classics',
    badge: null,
    flavorOptions: ['Персик-маракуйя', 'Цитрус', 'Черника', 'Earl Grey', 'Клубника'],
    excludedModifierNames: ['Альтернативное молоко'],
    sizes: sizes('tea', [{ size: 'S', price: 130, volumeMl: 250 }]),
  },
  {
    id: 'bumble',
    name: 'Бамбл',
    description: 'Эспрессо, апельсиновый сок и лёд, 400 мл',
    imageUrl: publicUrl('drinks/bumble.jpg'),
    isActive: true,
    sortOrder: 10,
    category: 'ice',
    badge: null,
    flavorOptions: [],
    sizes: sizes('bumble', [{ size: 'S', price: 250, volumeMl: 400 }]),
  },
  {
    id: 'espresso-tonic',
    name: 'Эспрессо-тоник',
    description: 'Эспрессо с тоником и льдом. Сироп на выбор',
    imageUrl: publicUrl('drinks/espresso-tonic.jpg'),
    isActive: true,
    sortOrder: 11,
    category: 'ice',
    badge: null,
    flavorOptions: [],
    sizes: sizes('espresso-tonic', [{ size: 'S', price: 250, volumeMl: 400 }]),
  },
  {
    id: 'iced-latte',
    name: 'Айс-латте',
    description: 'Холодный латте 400 мл. Сироп на выбор',
    imageUrl: publicUrl('drinks/iced-latte.jpg'),
    isActive: true,
    sortOrder: 12,
    category: 'ice',
    badge: null,
    flavorOptions: [],
    sizes: sizes('iced-latte', [{ size: 'S', price: 250, volumeMl: 400 }]),
  },
];
