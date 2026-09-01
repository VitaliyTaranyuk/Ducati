import type { CartItem, CartModifier, DrinkCategory, DrinkSize } from '../types';

export const CATEGORY_TABS: { id: DrinkCategory; label: string }[] = [
  { id: 'classics', label: 'Классика' },
  { id: 'special', label: 'Спешл' },
  { id: 'ice', label: 'Айс' },
];

export const CATEGORY_LABEL: Record<DrinkCategory, string> = {
  classics: 'Классика',
  special: 'Спешл',
  ice: 'Айс',
};

export const FALLBACK_VOLUME: Record<DrinkSize, number> = {
  S: 250,
  M: 350,
  L: 450,
};

export function formatVolume(volumeMl: number): string {
  return `${volumeMl} мл`;
}

export function formatSizePrice(volumeMl: number, price: number): string {
  return `${volumeMl} мл · ${price} ₽`;
}

export function cartLineKey(item: {
  drinkId: string;
  size: string;
  flavor?: string | null;
  modifiers?: { modifierId: string }[];
}): string {
  const mods = (item.modifiers ?? [])
    .map((m) => m.modifierId)
    .sort()
    .join(',');
  return `${item.drinkId}|${item.size}|${item.flavor ?? ''}|${mods}`;
}

export function lineExtras(modifiers: CartModifier[]): number {
  return modifiers.reduce((sum, m) => sum + m.price, 0);
}

export function lineUnitTotal(item: Pick<CartItem, 'unitPrice' | 'modifiers'>): number {
  return item.unitPrice + lineExtras(item.modifiers ?? []);
}

export function formatItemExtras(item: {
  flavor?: string | null;
  modifiers?: { name: string }[];
}): string | null {
  const parts: string[] = [];
  if (item.flavor) parts.push(item.flavor);
  for (const m of item.modifiers ?? []) parts.push(m.name);
  return parts.length ? parts.join(' · ') : null;
}

const MENU_RETURN_KEY = 'ducati-menu-return';

export function parseDrinkCategory(value: string | null | undefined): DrinkCategory | null {
  if (value === 'classics' || value === 'special' || value === 'ice') return value;
  return null;
}

export function drinkAnchorId(drinkId: string): string {
  return `drink-${drinkId}`;
}

export function drinkIdFromHash(hash: string): string | null {
  if (!hash.startsWith('#drink-')) return null;
  const id = hash.slice('#drink-'.length);
  return id || null;
}

export function drinkMenuPath(drink: { id: string; category?: string | null }): string {
  const category = parseDrinkCategory(drink.category) ?? 'classics';
  const query = category === 'classics' ? '' : `?category=${category}`;
  return `/${query}#${drinkAnchorId(drink.id)}`;
}

export function saveMenuReturn(drink: { id: string; category?: string | null }): void {
  try {
    sessionStorage.setItem(
      MENU_RETURN_KEY,
      JSON.stringify({
        drinkId: drink.id,
        category: parseDrinkCategory(drink.category) ?? 'classics',
      }),
    );
  } catch {
    /* private mode */
  }
}

export function readMenuReturn(): { drinkId: string; category: DrinkCategory } | null {
  try {
    const raw = sessionStorage.getItem(MENU_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { drinkId?: string; category?: string };
    if (!parsed.drinkId) return null;
    return {
      drinkId: parsed.drinkId,
      category: parseDrinkCategory(parsed.category) ?? 'classics',
    };
  } catch {
    return null;
  }
}

export function clearMenuReturn(): void {
  try {
    sessionStorage.removeItem(MENU_RETURN_KEY);
  } catch {
    /* private mode */
  }
}
