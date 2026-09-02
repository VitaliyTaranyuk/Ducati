import { describe, expect, it } from 'vitest';
import { flavorBadge, flavorImageUrl } from './flavors';

describe('flavor badges and photos', () => {
  it('marks сырный as New and leaves other raf flavors plain', () => {
    expect(flavorBadge('Сырный')).toBe('New');
    expect(flavorBadge('Классика')).toBeUndefined();
    expect(flavorBadge('Халва')).toBeUndefined();
  });

  it('uses a cream-top photo for сырный on raf', () => {
    expect(flavorImageUrl('Сырный', 'raf')).toMatch(/cappuccino-cream/);
  });
});
