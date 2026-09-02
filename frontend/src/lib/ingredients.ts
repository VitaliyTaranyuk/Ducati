import type { Drink } from '../types';

const CLASSIC_FLAVORS = new Set(['Классика', 'Классический']);

const BASE: Record<string, string[]> = {
  cappuccino: ['эспрессо', 'молоко'],
  raf: ['эспрессо', 'сливки'],
  latte: ['эспрессо', 'молоко'],
  'flat-white': ['эспрессо', 'молоко'],
  americano: ['эспрессо', 'вода'],
  espresso: ['эспрессо'],
  'matcha-green': ['матча', 'молоко'],
  'cheese-raf': ['эспрессо', 'сливки', 'сырный крем'],
  'hot-chocolate': ['молоко'],
  tea: ['чай'],
  bumble: ['эспрессо', 'апельсиновый сок', 'лёд'],
  'espresso-tonic': ['эспрессо', 'тоник', 'лёд'],
  'iced-latte': ['эспрессо', 'молоко', 'лёд'],
};

export function drinkChips(
  drink: Pick<Drink, 'id' | 'flavorOptions'>,
  flavor: string,
  plantMilk: boolean,
): string[] {
  const chips: string[] = [];
  for (const item of BASE[drink.id] ?? []) {
    if (plantMilk && (item === 'молоко' || item === 'сливки')) {
      chips.push('растительное молоко');
    } else {
      chips.push(item);
    }
  }
  if (flavor && !CLASSIC_FLAVORS.has(flavor)) {
    chips.push(flavor.toLowerCase());
  }
  return chips;
}
