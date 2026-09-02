import { PrismaClient, UserRole, type DrinkCategory, type DrinkSize } from '@prisma/client';
import { hashPassword } from '../src/services/auth.js';

const prisma = new PrismaClient();

type SizeRow = { size: DrinkSize; price: number; volumeMl: number };

type DrinkSeed = {
  name: string;
  formerNames?: string[];
  description: string;
  category: DrinkCategory;
  badge?: string;
  flavorOptions?: string[];
  flavorPrices?: Record<string, { S?: number; M?: number; L?: number }>;
  excludedModifierNames?: string[];
  sizes: SizeRow[];
  imageUrl: string;
};

/** Seed photos live in frontend/public/drinks. Keep owner-set custom URLs. */
function isManagedMenuImage(url: string | null | undefined): boolean {
  if (!url) return true;
  if (/unsplash\.com/i.test(url)) return true;
  return url.startsWith('/drinks/');
}

function sml(prices: { s?: number; m?: number; l?: number }): SizeRow[] {
  const rows: SizeRow[] = [];
  if (prices.s != null) rows.push({ size: 'S', price: prices.s, volumeMl: 250 });
  if (prices.m != null) rows.push({ size: 'M', price: prices.m, volumeMl: 350 });
  if (prices.l != null) rows.push({ size: 'L', price: prices.l, volumeMl: 450 });
  return rows;
}

const MENU: DrinkSeed[] = [
  {
    name: 'Капучино',
    description: 'Классический капучино или капучино крем',
    category: 'classics',
    imageUrl: '/drinks/cappuccino.jpg',
    flavorOptions: ['Классический', 'Капучино крем'],
    flavorPrices: {
      Классический: { S: 140, M: 200, L: 270 },
      'Капучино крем': { S: 170, M: 250, L: 290 },
    },
    sizes: sml({ s: 140, m: 200, l: 270 }),
  },
  {
    name: 'Раф',
    formerNames: ['Раф / Капучино крем'],
    description: 'Сливочный раф на эспрессо и сливках. Классика, сезонное или авторский вкус',
    category: 'classics',
    imageUrl: '/drinks/raf.jpg',
    flavorOptions: ['Классика', 'Сырный', 'Халва', 'Цитрус', 'Арахис', 'Медовик'],
    flavorPrices: {
      Классика: { S: 170, M: 250, L: 290 },
      Сырный: { S: 230, M: 300, L: 350 },
      Халва: { S: 200, M: 270, L: 320 },
      Цитрус: { S: 200, M: 270, L: 320 },
      Арахис: { S: 200, M: 270, L: 320 },
      Медовик: { S: 200, M: 270, L: 320 },
    },
    sizes: sml({ s: 170, m: 250, l: 290 }),
  },
  {
    name: 'Латте',
    description: 'Классический латте или сезонный — тыква и орхидея',
    category: 'classics',
    imageUrl: '/drinks/latte.jpg',
    flavorOptions: ['Классический', 'Тыква', 'Орхидея'],
    flavorPrices: {
      Классический: { S: 140, M: 200, L: 270 },
      Тыква: { S: 190, M: 250, L: 290 },
      Орхидея: { S: 190, M: 250, L: 290 },
    },
    sizes: sml({ s: 140, m: 200, l: 270 }),
  },
  {
    name: 'Флэт Уайт',
    description: 'Двойной эспрессо и тонкий слой микропены',
    category: 'classics',
    imageUrl: '/drinks/flat-white.jpg',
    sizes: sml({ s: 170, m: 240, l: 310 }),
  },
  {
    name: 'Американо',
    description: 'Эспрессо с горячей водой',
    category: 'classics',
    imageUrl: '/drinks/americano.jpg',
    sizes: sml({ s: 120, m: 170 }),
  },
  {
    name: 'Эспрессо',
    description: 'Классический эспрессо 36 мл',
    category: 'classics',
    imageUrl: '/drinks/espresso.jpg',
    sizes: [{ size: 'S', price: 120, volumeMl: 36 }],
  },
  {
    name: 'Матча GREEN',
    description: 'Японская матча на молоке',
    category: 'classics',
    imageUrl: '/drinks/matcha.jpg',
    sizes: sml({ s: 190, m: 250, l: 290 }),
  },
  {
    name: 'Горячий шоколад / Какао',
    description: 'Густой горячий шоколад или классическое какао',
    category: 'classics',
    imageUrl: '/drinks/hot-chocolate.jpg',
    flavorOptions: ['Горячий шоколад', 'Какао'],
    sizes: sml({ s: 190, m: 260, l: 310 }),
  },
  {
    name: 'Чай',
    description: 'Яркий аромат, мягкая терпкость, чистое послевкусие',
    category: 'classics',
    imageUrl: '/drinks/tea.jpg',
    flavorOptions: ['Персик-маракуйя', 'Цитрус', 'Черника', 'Earl Grey', 'Клубника'],
    excludedModifierNames: ['Альтернативное молоко'],
    sizes: [{ size: 'S', price: 130, volumeMl: 250 }],
  },
  {
    name: 'Бамбл',
    description: 'Эспрессо, апельсиновый сок и лёд, 400 мл',
    category: 'ice',
    imageUrl: '/drinks/bumble.jpg',
    sizes: [{ size: 'S', price: 250, volumeMl: 400 }],
  },
  {
    name: 'Эспрессо-тоник',
    description: 'Эспрессо с тоником и льдом. Сироп на выбор',
    category: 'ice',
    imageUrl: '/drinks/espresso-tonic.jpg',
    sizes: [{ size: 'S', price: 250, volumeMl: 400 }],
  },
  {
    name: 'Айс-латте',
    description: 'Холодный латте 400 мл. Сироп на выбор',
    category: 'ice',
    imageUrl: '/drinks/iced-latte.jpg',
    sizes: [{ size: 'S', price: 250, volumeMl: 400 }],
  },
];

const MODIFIERS = [
  { name: 'Сироп', price: 40, sortOrder: 1 },
  { name: 'Альтернативное молоко', price: 60, sortOrder: 2 },
];

async function upsertDrink(seed: DrinkSeed, sortOrder: number) {
  const namesToFind = [seed.name, ...(seed.formerNames ?? [])];
  let existing = null;
  for (const name of namesToFind) {
    existing = await prisma.drink.findFirst({ where: { name } });
    if (existing) break;
  }

  const data = {
    name: seed.name,
    description: seed.description,
    category: seed.category,
    imageUrl:
      existing && !isManagedMenuImage(existing.imageUrl) ? existing.imageUrl : seed.imageUrl,
    isActive: true,
    sortOrder,
    badge: seed.badge ?? null,
    flavorOptions: seed.flavorOptions ?? [],
    flavorPrices: seed.flavorPrices ?? {},
    excludedModifierNames: seed.excludedModifierNames ?? [],
  };

  if (existing) {
    await prisma.drink.update({
      where: { id: existing.id },
      data,
    });
    await prisma.drinkSizeOption.deleteMany({ where: { drinkId: existing.id } });
    await prisma.drinkSizeOption.createMany({
      data: seed.sizes.map((s) => ({ drinkId: existing.id, ...s })),
    });
    return existing.id;
  }

  const created = await prisma.drink.create({
    data: {
      name: seed.name,
      category: seed.category,
      ...data,
      sizes: { create: seed.sizes },
    },
  });
  return created.id;
}

async function main() {
  const ownerEmail = 'owner@ducati.coffee';
  const baristaEmail = 'barista@ducati.coffee';

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      passwordHash: await hashPassword('owner123'),
      role: UserRole.owner,
      name: 'Владелец',
    },
  });

  await prisma.user.upsert({
    where: { email: baristaEmail },
    update: {},
    create: {
      email: baristaEmail,
      passwordHash: await hashPassword('barista123'),
      role: UserRole.barista,
      name: 'Бариста',
    },
  });

  for (const mod of MODIFIERS) {
    await prisma.modifier.upsert({
      where: { name: mod.name },
      update: { price: mod.price, isActive: true, sortOrder: mod.sortOrder },
      create: { name: mod.name, price: mod.price, sortOrder: mod.sortOrder },
    });
  }

  const keep = new Set(MENU.map((d) => `${d.category}::${d.name}`));

  for (let i = 0; i < MENU.length; i++) {
    await upsertDrink(MENU[i], i);
  }

  const extras = await prisma.drink.findMany();
  for (const drink of extras) {
    if (!keep.has(`${drink.category}::${drink.name}`)) {
      await prisma.drink.update({
        where: { id: drink.id },
        data: { isActive: false },
      });
    }
  }

  console.log('Seed complete. Owner:', owner.email, '/ owner123');
  console.log('Barista: barista@ducati.coffee / barista123');
  console.log(`Menu: ${MENU.length} drinks, ${MODIFIERS.length} modifiers`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
