import { PrismaClient, UserRole, type DrinkCategory, type DrinkSize } from '@prisma/client';
import { hashPassword } from '../src/services/auth.js';

const prisma = new PrismaClient();

type SizeRow = { size: DrinkSize; price: number; volumeMl: number };

type DrinkSeed = {
  name: string;
  description: string;
  category: DrinkCategory;
  badge?: string;
  flavorOptions?: string[];
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
    description: 'Классический капучино на эспрессо и молоке',
    category: 'classics',
    imageUrl: '/drinks/cappuccino.jpg',
    sizes: sml({ s: 140, m: 200, l: 270 }),
  },
  {
    name: 'Раф / Капучино крем',
    description: 'Сливочный раф или капучино крем — выберите вариант',
    category: 'classics',
    imageUrl: '/drinks/raf.jpg',
    flavorOptions: ['Раф', 'Капучино крем'],
    sizes: sml({ s: 170, m: 250, l: 290 }),
  },
  {
    name: 'Латте',
    description: 'Мягкий латте с бархатистым молоком',
    category: 'classics',
    imageUrl: '/drinks/latte.jpg',
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
    name: 'Латте тыква / орхидея',
    description: 'Сезонный латте — тыква или орхидея',
    category: 'special',
    imageUrl: '/drinks/latte-pumpkin.jpg',
    flavorOptions: ['Тыква', 'Орхидея'],
    sizes: sml({ s: 190, m: 250, l: 290 }),
  },
  {
    name: 'Матча GREEN',
    description: 'Японская матча на молоке',
    category: 'special',
    imageUrl: '/drinks/matcha.jpg',
    sizes: sml({ s: 190, m: 250, l: 290 }),
  },
  {
    name: 'Раф Халва / Цитрус / Арахис / Медовик',
    description: 'Авторский раф — выберите вкус',
    category: 'special',
    imageUrl: '/drinks/raf-halva.jpg',
    flavorOptions: ['Халва', 'Цитрус', 'Арахис', 'Медовик'],
    sizes: sml({ s: 200, m: 270, l: 320 }),
  },
  {
    name: 'Сырный раф',
    description: 'Раф с сырным кремом',
    category: 'special',
    imageUrl: '/drinks/cheese-raf.jpg',
    badge: 'NEW',
    sizes: sml({ s: 230, m: 300, l: 350 }),
  },
  {
    name: 'Горячий шоколад / Какао',
    description: 'Густой горячий шоколад или классическое какао',
    category: 'special',
    imageUrl: '/drinks/hot-chocolate.jpg',
    flavorOptions: ['Горячий шоколад', 'Какао'],
    sizes: sml({ s: 190, m: 260, l: 310 }),
  },
  {
    name: 'Чай',
    description: 'Яркий аромат, мягкая терпкость, чистое послевкусие',
    category: 'special',
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
  const existing = await prisma.drink.findUnique({
    where: { name_category: { name: seed.name, category: seed.category } },
  });

  const data = {
    description: seed.description,
    imageUrl:
      existing && !isManagedMenuImage(existing.imageUrl) ? existing.imageUrl : seed.imageUrl,
    isActive: true,
    sortOrder,
    badge: seed.badge ?? null,
    flavorOptions: seed.flavorOptions ?? [],
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
