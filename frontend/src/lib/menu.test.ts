import { describe, expect, it } from 'vitest';
import {
  CATEGORY_TABS,
  drinkMinPrice,
  drinkSizePrice,
  menuTabFor,
  parseDrinkCategory,
} from './menu';
import { FALLBACK_DRINKS } from '../data/catalog';

describe('menu tabs', () => {
  it('exposes only Классика and Айс', () => {
    expect(CATEGORY_TABS.map((t) => t.id)).toEqual(['classics', 'ice']);
    expect(CATEGORY_TABS.map((t) => t.label)).toEqual(['Классика', 'Айс']);
  });

  it('maps former special category onto classics', () => {
    expect(parseDrinkCategory('special')).toBe('classics');
    expect(parseDrinkCategory('classics')).toBe('classics');
    expect(parseDrinkCategory('ice')).toBe('ice');
    expect(menuTabFor('special')).toBe('classics');
    expect(menuTabFor('ice')).toBe('ice');
  });
});

describe('flavor prices after grouping', () => {
  it('charges signature raf more than classic at the same size', () => {
    const raf = FALLBACK_DRINKS.find((d) => d.id === 'raf')!;
    expect(drinkSizePrice(raf, 'M', 'Классика')).toBe(250);
    expect(drinkSizePrice(raf, 'M', 'Сырный')).toBe(300);
    expect(drinkSizePrice(raf, 'M', 'Халва')).toBe(270);
    expect(drinkMinPrice(raf)).toBe(170);
  });

  it('charges pumpkin latte more than classic latte', () => {
    const latte = FALLBACK_DRINKS.find((d) => d.id === 'latte')!;
    expect(drinkSizePrice(latte, 'S', 'Классический')).toBe(140);
    expect(drinkSizePrice(latte, 'S', 'Тыква')).toBe(190);
  });
});
