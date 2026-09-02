import { describe, expect, it } from 'vitest';
import { FALLBACK_DRINKS, resolveDrinkId } from './catalog';
import { menuTabFor } from '../lib/menu';
import { volumeSliderLayout } from '../lib/volumeSlider';

describe('grouped menu catalog', () => {
  it('has only classics and ice — no special tab leftovers', () => {
    const categories = new Set(FALLBACK_DRINKS.map((d) => d.category));
    expect([...categories].sort()).toEqual(['classics', 'ice']);
  });

  it('keeps cold drinks in ice and hot drinks in classics', () => {
    const ice = FALLBACK_DRINKS.filter((d) => menuTabFor(d.category) === 'ice').map((d) => d.id);
    const hot = FALLBACK_DRINKS.filter((d) => menuTabFor(d.category) === 'classics').map((d) => d.id);
    expect(ice).toEqual(['bumble', 'espresso-tonic', 'iced-latte']);
    expect(hot).toContain('raf');
    expect(hot).toContain('latte');
    expect(hot).toContain('cappuccino');
    expect(hot).toContain('tea');
    expect(hot).not.toContain('cheese-raf');
    expect(hot).not.toContain('iced-latte');
  });

  it('merges raf classic with seasonal and signature flavors on one card', () => {
    const raf = FALLBACK_DRINKS.find((d) => d.id === 'raf');
    expect(raf?.flavorOptions).toEqual(['Классика', 'Сырный', 'Халва', 'Цитрус', 'Арахис', 'Медовик']);
    expect(raf?.badge).toBeNull();
    expect(raf?.flavorPrices?.Классика?.M).toBe(250);
    expect(raf?.flavorPrices?.Сырный?.M).toBe(300);
    expect(raf?.flavorPrices?.Халва?.M).toBe(270);
    expect(FALLBACK_DRINKS.some((d) => d.id === 'raf-signature')).toBe(false);
    expect(FALLBACK_DRINKS.some((d) => d.id === 'cheese-raf')).toBe(false);
  });

  it('merges latte classic with pumpkin and orchid', () => {
    const latte = FALLBACK_DRINKS.find((d) => d.id === 'latte');
    expect(latte?.flavorOptions).toEqual(['Классический', 'Тыква', 'Орхидея']);
    expect(latte?.flavorPrices?.Классический?.S).toBe(140);
    expect(latte?.flavorPrices?.Тыква?.S).toBe(190);
    expect(FALLBACK_DRINKS.some((d) => d.id === 'latte-pumpkin')).toBe(false);
  });

  it('keeps cappuccino classic and cream on one card', () => {
    const cap = FALLBACK_DRINKS.find((d) => d.id === 'cappuccino');
    expect(cap?.flavorOptions).toEqual(['Классический', 'Капучино крем']);
  });

  it('resolves old drink ids to the grouped cards', () => {
    expect(resolveDrinkId('raf-cream')).toBe('raf');
    expect(resolveDrinkId('raf-signature')).toBe('raf');
    expect(resolveDrinkId('cheese-raf')).toBe('raf');
    expect(resolveDrinkId('latte-pumpkin')).toBe('latte');
    expect(resolveDrinkId('tea')).toBe('tea');
  });

  it('gives every drink at least one size and a matching slider layout', () => {
    for (const drink of FALLBACK_DRINKS) {
      expect(drink.sizes.length).toBeGreaterThan(0);
      const layout = volumeSliderLayout(drink.sizes.length);
      if (drink.sizes.length === 1) {
        expect(layout.mode).toBe('single');
        expect(layout.sidePad).toBeGreaterThan(0);
      } else {
        expect(layout.mode).toBe('multi');
        expect(layout.slots).toBe(drink.sizes.length);
        expect(layout.sidePad).toBe(0);
      }
    }
  });

  it('uses two volume slots for americano and one for espresso, tea, and ice', () => {
    expect(FALLBACK_DRINKS.find((d) => d.id === 'americano')?.sizes).toHaveLength(2);
    expect(FALLBACK_DRINKS.find((d) => d.id === 'espresso')?.sizes).toHaveLength(1);
    expect(FALLBACK_DRINKS.find((d) => d.id === 'tea')?.sizes).toHaveLength(1);
    expect(FALLBACK_DRINKS.find((d) => d.id === 'bumble')?.sizes).toHaveLength(1);
  });

  it('keeps unique names in the customer menu', () => {
    const names = FALLBACK_DRINKS.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
