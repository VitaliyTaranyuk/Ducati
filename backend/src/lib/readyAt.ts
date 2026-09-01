/** Shop wall clock. Moscow has been UTC+3 year-round since 2014. */
export const SHOP_TZ = 'Europe/Moscow';
export const SHOP_OFFSET = '+03:00';
export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 19;
export const MAX_DAY_OFFSET = 1;
export const PAST_SLACK_MS = 2 * 60 * 1000;

type ShopParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function ymdKey(p: Pick<ShopParts, 'year' | 'month' | 'day'>): number {
  return p.year * 10000 + p.month * 100 + p.day;
}

function shopParts(date: Date): ShopParts {
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

function addShopDays(
  p: Pick<ShopParts, 'year' | 'month' | 'day'>,
  days: number,
): Pick<ShopParts, 'year' | 'month' | 'day'> {
  const x = new Date(Date.UTC(p.year, p.month - 1, p.day + days));
  return { year: x.getUTCFullYear(), month: x.getUTCMonth() + 1, day: x.getUTCDate() };
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

export function readyAtErrorMessage(): string {
  return `Время готовности: с ${pad2(OPEN_HOUR)}:00 до ${pad2(CLOSE_HOUR)}:00, не в прошлом и не позднее завтра`;
}
