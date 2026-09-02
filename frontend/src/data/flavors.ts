import { publicUrl } from '../lib/assets';

export interface FlavorVisual {
  id: string;
  name: string;
  imageUrl: string;
}

function photo(id: string, ext: 'jpg' | 'png' = 'jpg'): string {
  return publicUrl(`flavors/${id}.${ext}`);
}

/** Per-drink classic photos so «Классический» on latte ≠ cappuccino. */
const DRINK_FLAVOR_IMAGES: Record<string, Record<string, string>> = {
  raf: {
    Классика: publicUrl('drinks/raf.jpg'),
    Сырный: publicUrl('flavors/cappuccino-cream.jpg'),
  },
  cappuccino: { Классический: publicUrl('drinks/cappuccino.jpg') },
  latte: { Классический: publicUrl('drinks/latte.jpg') },
};

/** Drink-surface photos for flavor tiles. */
export const FLAVORS: FlavorVisual[] = [
  { id: 'cappuccino', name: 'Классический', imageUrl: publicUrl('drinks/cappuccino.jpg') },
  { id: 'cappuccino-cream', name: 'Капучино крем', imageUrl: photo('cappuccino-cream') },
  { id: 'raf', name: 'Классика', imageUrl: photo('raf') },
  { id: 'cheese', name: 'Сырный', imageUrl: publicUrl('flavors/cappuccino-cream.jpg') },
  { id: 'pumpkin', name: 'Тыква', imageUrl: photo('pumpkin', 'png') },
  { id: 'orchid', name: 'Орхидея', imageUrl: photo('orchid', 'png') },
  { id: 'halva', name: 'Халва', imageUrl: photo('halva', 'png') },
  { id: 'citrus', name: 'Цитрус', imageUrl: photo('citrus', 'png') },
  { id: 'peanut', name: 'Арахис', imageUrl: photo('peanut', 'png') },
  { id: 'medovik', name: 'Медовик', imageUrl: photo('medovik', 'png') },
  { id: 'hot-chocolate', name: 'Горячий шоколад', imageUrl: photo('hot-chocolate', 'png') },
  { id: 'cocoa', name: 'Какао', imageUrl: photo('cocoa', 'png') },
  { id: 'peach-passion', name: 'Персик-маракуйя', imageUrl: photo('peach-passion', 'png') },
  { id: 'blueberry', name: 'Черника', imageUrl: photo('blueberry', 'png') },
  { id: 'earl-grey', name: 'Earl Grey', imageUrl: photo('earl-grey', 'png') },
  { id: 'strawberry', name: 'Клубника', imageUrl: photo('strawberry', 'png') },
];

export function flavorImageUrl(name: string, drinkId?: string): string | undefined {
  if (drinkId && DRINK_FLAVOR_IMAGES[drinkId]?.[name]) {
    return DRINK_FLAVOR_IMAGES[drinkId][name];
  }
  return FLAVORS.find((f) => f.name === name)?.imageUrl;
}

export function findFlavor(name: string, drinkId?: string): FlavorVisual | undefined {
  const imageUrl = flavorImageUrl(name, drinkId);
  if (imageUrl) return { id: name, name, imageUrl };
  return FLAVORS.find((f) => f.name === name);
}

const FLAVOR_BADGES: Record<string, string> = {
  Сырный: 'New',
};

export function flavorBadge(name: string): string | undefined {
  return FLAVOR_BADGES[name];
}
