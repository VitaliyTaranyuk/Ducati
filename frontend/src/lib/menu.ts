import type {
  CartItem,
  CartModifier,
  Drink,
  DrinkCategory,
  DrinkSize,
  DrinkSizeOption,
  FlavorPrices,
} from '../types';

/** Customer menu tabs. Former «Спешл» drinks live in Классика. */
export type MenuTab = 'classics' | 'ice';

export const CATEGORY_TABS: { id: MenuTab; label: string }[] = [
  { id: 'classics', label: 'Классика' },
  { id: 'ice', label: 'Айс' },
];

export const CATEGORY_LABEL: Record<DrinkCategory, string> = {
  classics: 'Классика',
  special: 'Классика',
  ice: 'Айс',
};

export const ALT_MILK_MODIFIER_NAME = 'Альтернативное молоко';

/** Hot drinks (including former specials) vs ice. */
export function menuTabFor(category: string | null | undefined): MenuTab {
  return category === 'ice' ? 'ice' : 'classics';
}

export const FALLBACK_VOLUME: Record<DrinkSize, number> = {
  S: 250,
  M: 350,
  L: 450,
};

export function formatVolume(volumeMl: number): string {
  return `${volumeMl}\u00a0мл`;
}

export function formatPrice(price: number): string {
  return `${price}\u00a0₽`;
}

export function formatSizePrice(volumeMl: number, price: number): string {
  return `${formatVolume(volumeMl)} · ${formatPrice(price)}`;
}

/** One size → that one. Two → smaller. Three → middle (usually M). */
export function defaultDrinkSize(
  sizes: Pick<DrinkSizeOption, 'size' | 'volumeMl'>[],
): DrinkSize | null {
  if (sizes.length === 0) return null;
  const ordered = [...sizes].sort((a, b) => a.volumeMl - b.volumeMl);
  return ordered[Math.floor((ordered.length - 1) / 2)]?.size ?? null;
}

export const SYRUP_MODIFIER_NAME = 'Сироп';

export function parseFlavorPrices(value: unknown): FlavorPrices {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: FlavorPrices = {};
  for (const [flavor, sizes] of Object.entries(value as Record<string, unknown>)) {
    if (!sizes || typeof sizes !== 'object' || Array.isArray(sizes)) continue;
    const row: Partial<Record<DrinkSize, number>> = {};
    for (const size of ['S', 'M', 'L'] as const) {
      const n = (sizes as Record<string, unknown>)[size];
      if (typeof n === 'number' && n > 0) row[size] = n;
    }
    if (Object.keys(row).length) out[flavor] = row;
  }
  return out;
}

export function hasPricedFlavors(drink: Pick<Drink, 'flavorPrices'>): boolean {
  return Object.keys(drink.flavorPrices ?? {}).length > 0;
}

export function drinkSizePrice(
  drink: Pick<Drink, 'sizes' | 'flavorPrices'>,
  size: DrinkSize,
  flavor?: string | null,
): number {
  const override = flavor ? drink.flavorPrices?.[flavor]?.[size] : undefined;
  if (typeof override === 'number') return override;
  return drink.sizes.find((s) => s.size === size)?.price ?? 0;
}

export function drinkMinPrice(drink: Pick<Drink, 'sizes' | 'flavorPrices'>): number {
  const nums = drink.sizes.map((s) => s.price);
  for (const sizes of Object.values(drink.flavorPrices ?? {})) {
    for (const p of Object.values(sizes ?? {})) {
      if (typeof p === 'number') nums.push(p);
    }
  }
  return nums.length ? Math.min(...nums) : 0;
}

export function cartLineKey(item: {
  drinkId: string;
  size: string;
  flavor?: string | null;
  syrup?: string | null;
  modifiers?: { modifierId: string }[];
}): string {
  const mods = (item.modifiers ?? [])
    .map((m) => m.modifierId)
    .sort()
    .join(',');
  return `${item.drinkId}|${item.size}|${item.flavor ?? ''}|${item.syrup ?? ''}|${mods}`;
}

export function lineExtras(modifiers: CartModifier[]): number {
  return modifiers.reduce((sum, m) => sum + m.price, 0);
}

export function lineUnitTotal(item: Pick<CartItem, 'unitPrice' | 'modifiers'>): number {
  return item.unitPrice + lineExtras(item.modifiers ?? []);
}

export function formatItemExtras(item: {
  flavor?: string | null;
  syrup?: string | null;
  modifiers?: { name: string }[];
}): string | null {
  const parts: string[] = [];
  if (item.flavor) parts.push(item.flavor);
  if (item.syrup) parts.push(item.syrup);
  for (const m of item.modifiers ?? []) {
    if (m.name !== SYRUP_MODIFIER_NAME) parts.push(m.name);
  }
  return parts.length ? parts.join(' · ') : null;
}

const MENU_RETURN_KEY = 'ducati-menu-return';

export function parseDrinkCategory(value: string | null | undefined): DrinkCategory | null {
  if (value === 'ice') return 'ice';
  if (value === 'classics' || value === 'special') return 'classics';
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
  const category = menuTabFor(drink.category);
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
