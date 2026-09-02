import { describe, expect, it } from 'vitest';
import { drinkChips } from './ingredients';

describe('drinkChips', () => {
  it('swaps dairy for plant milk and adds a non-classic flavor', () => {
    expect(drinkChips({ id: 'raf', flavorOptions: [] }, 'Классика', false)).toEqual([
      'эспрессо',
      'сливки',
    ]);
    expect(drinkChips({ id: 'raf', flavorOptions: [] }, 'Халва', true)).toEqual([
      'эспрессо',
      'растительное молоко',
      'халва',
    ]);
    expect(drinkChips({ id: 'raf', flavorOptions: [] }, 'Сырный', false)).toEqual([
      'эспрессо',
      'сливки',
      'сырный крем',
    ]);
  });

  it('does not treat iced latte as a hot latte variant', () => {
    expect(drinkChips({ id: 'iced-latte', flavorOptions: [] }, '', false)).toContain('лёд');
  });
});
