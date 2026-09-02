import { publicUrl } from '../lib/assets';

export interface FlavorVisual {
  id: string;
  name: string;
  imageUrl: string;
}

function photo(id: string): string {
  return publicUrl(`flavors/${id}.jpg`);
}

/** Ingredient photos for drink flavor / variant chips. */
export const FLAVORS: FlavorVisual[] = [
  { id: 'raf', name: 'Раф', imageUrl: photo('raf') },
  { id: 'cappuccino-cream', name: 'Капучино крем', imageUrl: photo('cappuccino-cream') },
  { id: 'pumpkin', name: 'Тыква', imageUrl: photo('pumpkin') },
  { id: 'orchid', name: 'Орхидея', imageUrl: photo('orchid') },
  { id: 'halva', name: 'Халва', imageUrl: photo('halva') },
  { id: 'citrus', name: 'Цитрус', imageUrl: photo('citrus') },
  { id: 'peanut', name: 'Арахис', imageUrl: photo('peanut') },
  { id: 'medovik', name: 'Медовик', imageUrl: photo('medovik') },
  { id: 'hot-chocolate', name: 'Горячий шоколад', imageUrl: photo('hot-chocolate') },
  { id: 'cocoa', name: 'Какао', imageUrl: photo('cocoa') },
  { id: 'peach-passion', name: 'Персик-маракуйя', imageUrl: photo('peach-passion') },
  { id: 'blueberry', name: 'Черника', imageUrl: photo('blueberry') },
  { id: 'earl-grey', name: 'Earl Grey', imageUrl: photo('earl-grey') },
  { id: 'strawberry', name: 'Клубника', imageUrl: photo('strawberry') },
];

export function findFlavor(name: string): FlavorVisual | undefined {
  return FLAVORS.find((f) => f.name === name);
}
