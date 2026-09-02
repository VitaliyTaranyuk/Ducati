import { describe, expect, it } from 'vitest';
import {
  formatReadyAtClock,
  fromShopLocal,
  shiftReadyAtDay,
  shopParts,
} from './readyAt';

describe('checkout ticket time', () => {
  const now = fromShopLocal(2026, 9, 2, 10, 0);

  it('formats the clock as HH:MM', () => {
    expect(formatReadyAtClock(fromShopLocal(2026, 9, 2, 14, 30))).toBe('14:30');
    expect(formatReadyAtClock(fromShopLocal(2026, 9, 2, 8, 5))).toBe('08:05');
  });

  it('keeps the hour when moving a daytime slot to tomorrow', () => {
    const value = fromShopLocal(2026, 9, 2, 14, 30);
    const next = shiftReadyAtDay(value, 1, now);
    expect(shopParts(next)).toMatchObject({ day: 3, month: 9, hour: 14, minute: 30 });
  });

  it('returns the same day when today is selected again', () => {
    const value = fromShopLocal(2026, 9, 2, 14, 30);
    const next = shiftReadyAtDay(value, 0, now);
    expect(shopParts(next)).toMatchObject({ day: 2, hour: 14, minute: 30 });
  });
});
