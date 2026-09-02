/** Shop wall clock. Moscow has been UTC+3 year-round since 2014. */
export const SHOP_TZ = 'Europe/Moscow';
export const SHOP_OFFSET = '+03:00';
export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 19;
export const MINUTE_STEP = 5;
export const DEFAULT_LEAD_MIN = 15;
export const PAST_SLACK_MS = 2 * 60 * 1000;
export const MAX_DAY_OFFSET = 1;

export type ShopParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export type HourSlot = {
  dayOffset: 0 | 1;
  year: number;
  month: number;
  day: number;
  hour: number;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function ymdKey(p: Pick<ShopParts, 'year' | 'month' | 'day'>): number {
  return p.year * 10000 + p.month * 100 + p.day;
}

export function shopParts(date: Date = new Date()): ShopParts {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

export function addShopDays(
  p: Pick<ShopParts, 'year' | 'month' | 'day'>,
  days: number,
): Pick<ShopParts, 'year' | 'month' | 'day'> {
  const x = new Date(Date.UTC(p.year, p.month - 1, p.day + days));
  return { year: x.getUTCFullYear(), month: x.getUTCMonth() + 1, day: x.getUTCDate() };
}

export function fromShopLocal(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  return new Date(
    `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00${SHOP_OFFSET}`,
  );
}

function ceilToStep(date: Date): Date {
  const stepMs = MINUTE_STEP * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / stepMs) * stepMs);
}

export function isValidReadyAt(date: Date, now: Date = new Date()): boolean {
  if (Number.isNaN(date.getTime())) return false;
  if (date.getTime() < now.getTime() - PAST_SLACK_MS) return false;

  const p = shopParts(date);
  if (p.hour < OPEN_HOUR) return false;
  if (p.hour > CLOSE_HOUR) return false;
  if (p.hour === CLOSE_HOUR && p.minute > 0) return false;

  const n = shopParts(now);
  const day = ymdKey(p);
  if (day < ymdKey(n)) return false;
  if (day > ymdKey(addShopDays(n, MAX_DAY_OFFSET))) return false;
  return true;
}

export function snapReadyAt(input: Date, now: Date = new Date()): Date {
  const n = shopParts(now);
  const todayOpen = fromShopLocal(n.year, n.month, n.day, OPEN_HOUR, 0);
  const todayClose = fromShopLocal(n.year, n.month, n.day, CLOSE_HOUR, 0);
  const tom = addShopDays(n, MAX_DAY_OFFSET);
  const tomOpen = fromShopLocal(tom.year, tom.month, tom.day, OPEN_HOUR, 0);
  const tomClose = fromShopLocal(tom.year, tom.month, tom.day, CLOSE_HOUR, 0);

  let d = ceilToStep(input);
  if (d.getTime() < now.getTime()) d = ceilToStep(now);

  if (d.getTime() < todayOpen.getTime()) return todayOpen;
  if (d.getTime() > todayClose.getTime() && d.getTime() < tomOpen.getTime()) return tomOpen;
  if (d.getTime() > tomClose.getTime()) return tomClose;
  return d;
}

export function defaultReadyAt(now: Date = new Date()): Date {
  return snapReadyAt(new Date(now.getTime() + DEFAULT_LEAD_MIN * 60 * 1000), now);
}

export function readStoredReadyAt(now: Date = new Date()): Date {
  try {
    const raw = sessionStorage.getItem('readyAt');
    if (raw) {
      const d = new Date(raw);
      if (isValidReadyAt(d, now)) return d;
    }
  } catch {
    /* private mode */
  }
  return defaultReadyAt(now);
}

export function minuteOptions(slot: HourSlot, now: Date = new Date()): number[] {
  const all =
    slot.hour === CLOSE_HOUR
      ? [0]
      : Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP);
  return all.filter(
    (minute) =>
      fromShopLocal(slot.year, slot.month, slot.day, slot.hour, minute).getTime() >=
      now.getTime() - PAST_SLACK_MS,
  );
}

export function hourSlots(now: Date = new Date()): HourSlot[] {
  const n = shopParts(now);
  const slots: HourSlot[] = [];
  for (const dayOffset of [0, 1] as const) {
    const ymd = dayOffset === 0 ? n : addShopDays(n, dayOffset);
    for (let hour = OPEN_HOUR; hour <= CLOSE_HOUR; hour += 1) {
      const slot: HourSlot = { dayOffset, ...ymd, hour };
      if (minuteOptions(slot, now).length === 0) continue;
      slots.push(slot);
    }
  }
  return slots;
}

export function slotOf(date: Date, now: Date = new Date()): HourSlot {
  const p = shopParts(date);
  const n = shopParts(now);
  const dayOffset: 0 | 1 = ymdKey(p) === ymdKey(n) ? 0 : 1;
  const ymd = dayOffset === 0 ? n : addShopDays(n, 1);
  return { dayOffset, ...ymd, hour: p.hour };
}

export function combineReadyAt(slot: HourSlot, minute: number): Date {
  return fromShopLocal(slot.year, slot.month, slot.day, slot.hour, minute);
}

export function writeStoredReadyAt(date: Date): void {
  try {
    sessionStorage.setItem('readyAt', date.toISOString());
  } catch {
    /* private mode */
  }
}

export function formatReadyAtClock(date: Date): string {
  const p = shopParts(date);
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

export function formatShopDay(now: Date, dayOffset: 0 | 1): string {
  const n = shopParts(now);
  const ymd = dayOffset === 0 ? n : addShopDays(n, dayOffset);
  return fromShopLocal(ymd.year, ymd.month, ymd.day, 12, 0).toLocaleDateString('ru-RU', {
    timeZone: SHOP_TZ,
    day: 'numeric',
    month: 'long',
  });
}

export function shiftReadyAtDay(value: Date, dayOffset: 0 | 1, now: Date = new Date()): Date {
  const nextSlots = hourSlots(now).filter((s) => s.dayOffset === dayOffset);
  if (nextSlots.length === 0) return value;
  const current = slotOf(value, now);
  const parts = shopParts(value);
  const nextSlot = nextSlots.find((s) => s.hour === current.hour) ?? nextSlots[0];
  const opts = minuteOptions(nextSlot, now);
  const minute = opts.includes(parts.minute) ? parts.minute : (opts[0] ?? 0);
  return combineReadyAt(nextSlot, minute);
}

export function formatReadyAtLabel(date: Date, now: Date = new Date()): string {
  const p = shopParts(date);
  const n = shopParts(now);
  const dayWord = ymdKey(p) === ymdKey(n) ? 'Сегодня' : 'Завтра';
  const datePart = date.toLocaleDateString('ru-RU', {
    timeZone: SHOP_TZ,
    day: 'numeric',
    month: 'long',
  });
  return `${dayWord}, ${datePart} · ${pad2(p.hour)}:${pad2(p.minute)}`;
}
