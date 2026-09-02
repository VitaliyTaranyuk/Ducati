import type { DrinkSize } from '@prisma/client';

type FlavorPriceMap = Partial<Record<string, Partial<Record<DrinkSize, number>>>>;

export function parseFlavorPrices(value: unknown): FlavorPriceMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: FlavorPriceMap = {};
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

export function flavorSizePrice(
  flavorPrices: unknown,
  flavor: string | null | undefined,
  size: DrinkSize,
): number | null {
  if (!flavor) return null;
  const n = parseFlavorPrices(flavorPrices)[flavor]?.[size];
  return typeof n === 'number' ? n : null;
}
