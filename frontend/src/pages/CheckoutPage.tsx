import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { drinksApi, ordersApi } from '../lib/api';
import { enqueueRequest } from '../lib/offlineQueue';
import { flavorImageUrl } from '../data/flavors';
import { formatPrice } from '../lib/menu';
import {
  CLOSE_HOUR,
  OPEN_HOUR,
  formatReadyAtClock,
  formatShopDay,
  hourSlots,
  readStoredReadyAt,
  shiftReadyAtDay,
  slotOf,
  snapReadyAt,
  writeStoredReadyAt,
} from '../lib/readyAt';
import { ReadyTimePicker } from '../components/ReadyTimePicker';
import { useCartStore, useOfflineStore } from '../store';
import type { CartItem, Drink } from '../types';

function drinksCountLabel(n: number): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} напиток`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} напитка`;
  return `${n} напитков`;
}

function shortDrinkLabel(item: CartItem): string {
  if (!item.flavor) return item.drinkName;
  if (item.flavor.toLowerCase().includes(item.drinkName.toLowerCase())) return item.flavor;
  return `${item.drinkName} ${item.flavor.toLowerCase()}`;
}

function thumbUrl(item: CartItem, drinks: Drink[]): string | undefined {
  const fromFlavor = item.flavor ? flavorImageUrl(item.flavor, item.drinkId) : undefined;
  if (fromFlavor) return fromFlavor;
  return drinks.find((d) => d.id === item.drinkId)?.imageUrl ?? undefined;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCartStore();
  const { isOnline, setQueueCount } = useOfflineStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [queued, setQueued] = useState(false);
  const [readyAt, setReadyAt] = useState(readStoredReadyAt);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { data } = useQuery({
    queryKey: ['drinks'],
    queryFn: () => drinksApi.list(),
    staleTime: 5 * 60 * 1000,
  });
  const drinks = data?.drinks ?? [];

  const handleReadyAt = useCallback((next: Date) => {
    setReadyAt(next);
    writeStoredReadyAt(next);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || items.length === 0) return;
    setLoading(true);

    const payload = {
      customerName: name.trim(),
      customerPhone: phone.trim(),
      comment: comment.trim() || undefined,
      readyAt: snapReadyAt(readyAt).toISOString(),
      items: items.map((i) => ({
        drinkId: i.drinkId,
        size: i.size,
        quantity: i.quantity,
        flavor: i.flavor,
        syrup: i.syrup,
        modifiers: i.modifiers.map((m) => ({ modifierId: m.modifierId })),
      })),
    };

    try {
      if (isOnline) {
        await ordersApi.create(payload);
        setSuccess(true);
      } else {
        await enqueueRequest('/orders', 'POST', payload);
        const queue = await import('../lib/offlineQueue').then((m) => m.getQueuedRequests());
        setQueueCount(queue.length);
        setQueued(true);
      }
      clear();
      sessionStorage.removeItem('readyAt');
    } catch {
      await enqueueRequest('/orders', 'POST', payload);
      const queue = await import('../lib/offlineQueue').then((m) => m.getQueuedRequests());
      setQueueCount(queue.length);
      setQueued(true);
      clear();
    } finally {
      setLoading(false);
    }
  };

  if (success || queued) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="text-5xl mb-4">{queued ? '📤' : '✅'}</div>
        <h1 className="font-display text-2xl font-bold text-brand-dark">
          {queued ? 'Заказ сохранён' : 'Заказ принят!'}
        </h1>
        <p className="text-brand-dark/60 mt-2">
          {queued
            ? 'Будет отправлен при подключении к сети'
            : 'Оплата на месте при получении'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-brand text-brand-paper rounded-2xl"
        >
          На главную
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-brand-dark/60 text-lg">Корзина пуста</p>
        <Link to="/" className="inline-block mt-4 text-brand font-medium">
          ← К меню
        </Link>
      </div>
    );
  }

  const cups = items.reduce((sum, i) => sum + i.quantity, 0);
  const clock = formatReadyAtClock(readyAt);
  const currentSlot = slotOf(readyAt, now);
  const slots = hourSlots(now);
  const todayAvailable = slots.some((s) => s.dayOffset === 0);
  const tomorrowAvailable = slots.some((s) => s.dayOffset === 1);
  const canPick = slots.length > 0;
  const dayWord = currentSlot.dayOffset === 1 ? 'Завтра' : 'Сегодня';
  const ctaWhen = currentSlot.dayOffset === 1 ? `завтра к ${clock}` : `к ${clock}`;
  const names = items
    .map((item) => {
      const label = shortDrinkLabel(item);
      return item.quantity > 1 ? `${label} ×${item.quantity}` : label;
    })
    .join(', ');
  const thumbs = items.slice(0, 3);

  return (
    <div className="px-4 pb-36">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 mb-4 pt-1">
          <Link
            to="/cart"
            aria-label="Назад в корзину"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark/[0.06] text-sm text-brand-dark/65"
          >
            ←
          </Link>
          <h1 className="font-display text-2xl font-bold text-brand-dark">Заберу</h1>
        </div>

        <div
          data-testid="checkout-ticket"
          className="rounded-[20px] border border-brand-dark/10 bg-brand-paper px-[18px] pb-4 pt-5 text-center"
        >
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-brand-dark/40">
            Готовность
          </p>
          {canPick ? (
            <>
              <p
                data-testid="checkout-clock"
                className="font-display mt-2 text-[64px] leading-none tracking-[-0.03em] tabular-nums"
              >
                {clock}
              </p>
              <p className="mt-1 mb-3.5 text-[15px] text-brand-dark/65">
                {dayWord}, {formatShopDay(now, currentSlot.dayOffset)}
              </p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="День готовности">
                {(
                  [
                    { offset: 0 as const, label: 'Сегодня', available: todayAvailable },
                    { offset: 1 as const, label: 'Завтра', available: tomorrowAvailable },
                  ]
                ).map((day) => {
                  const selected = currentSlot.dayOffset === day.offset;
                  return (
                    <button
                      key={day.offset}
                      type="button"
                      data-testid={day.offset === 0 ? 'checkout-day-today' : 'checkout-day-tomorrow'}
                      disabled={!day.available}
                      aria-pressed={selected}
                      onClick={() => handleReadyAt(shiftReadyAtDay(readyAt, day.offset, now))}
                      className={`rounded-[14px] px-2 py-2.5 text-center ${
                        selected
                          ? 'bg-brand-creamLight text-brand-dark shadow-[inset_0_0_0_1px_#3c3028] font-semibold'
                          : 'bg-brand-dark/[0.06] text-brand-dark/70'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <span className="block text-[15px] leading-tight">{day.label}</span>
                      <span className="mt-0.5 block text-[12px] font-normal text-brand-dark/45">
                        {formatShopDay(now, day.offset)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                data-testid="checkout-hour"
                onClick={() => setSheetOpen(true)}
                className="mt-3 w-full py-1 text-sm font-semibold text-brand"
              >
                Изменить час ›
              </button>
            </>
          ) : (
            <p className="mt-3 mb-2 text-sm text-brand-dark/60">
              Сейчас нельзя выбрать время — кофейня работает с {String(OPEN_HOUR).padStart(2, '0')}
              :00 до {String(CLOSE_HOUR).padStart(2, '0')}:00.
            </p>
          )}

          <div
            className="my-4 h-px bg-[length:12px_1px] bg-repeat-x"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(60,48,40,0.2) 6px, transparent 6px)',
            }}
            aria-hidden
          />

          <div data-testid="checkout-drinks" className="flex items-center gap-2.5 text-left">
            <div className="flex shrink-0">
              {thumbs.map((item, i) => {
                const src = thumbUrl(item, drinks);
                return (
                  <span
                    key={item.lineKey}
                    className={`inline-block h-10 w-10 overflow-hidden rounded-[10px] border-2 border-brand-paper bg-brand-accent ${
                      i > 0 ? '-ml-3' : ''
                    }`}
                  >
                    {src ? (
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                );
              })}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{drinksCountLabel(cups)}</p>
              <p className="truncate text-[13px] text-brand-dark/50">{names}</p>
            </div>
            <p className="shrink-0 font-bold text-brand">{formatPrice(total())}</p>
          </div>
        </div>

        <p className="mt-4 mb-2 text-[12px] font-bold uppercase tracking-[0.04em] text-brand-dark/45">
          Для бариста
        </p>
        <div className="overflow-hidden rounded-2xl border border-brand-dark/10 bg-brand-paper">
          <label className="block px-3.5 pt-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-brand-dark/40">
            Имя
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent px-3.5 py-2.5 text-[15px] outline-none"
            placeholder="Как к вам обращаться"
            maxLength={100}
            autoComplete="name"
          />
          <label className="block border-t border-brand-dark/10 px-3.5 pt-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-brand-dark/40">
            Телефон
          </label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-transparent px-3.5 py-2.5 text-[15px] outline-none"
            placeholder="+7 (999) 123-45-67"
            maxLength={20}
            autoComplete="tel"
          />
          <button
            type="button"
            onClick={() => setCommentOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 border-t border-brand-dark/10 px-3.5 py-3 text-left"
            aria-expanded={commentOpen}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-dark/20" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Комментарий</span>
              <span className="block text-[13px] text-brand-dark/50">
                {comment.trim() || 'необязательно'}
              </span>
            </span>
            <span className="text-lg text-brand-dark/30" aria-hidden>
              ›
            </span>
          </button>
          {commentOpen && (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border-t border-brand-dark/10 bg-transparent px-3.5 py-2.5 text-[15px] outline-none"
              rows={3}
              placeholder="Без сахара, с собой…"
              maxLength={500}
            />
          )}
        </div>

        {!isOnline && (
          <p className="mt-3 text-sm text-amber-700">
            Нет сети — заказ будет сохранён и отправлен позже
          </p>
        )}

        <ReadyTimePicker
          value={readyAt}
          onChange={handleReadyAt}
          hideTrigger
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />

        <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-brand-creamLight via-brand-creamLight to-transparent px-4 pb-4 pt-3 safe-bottom">
          <div className="mx-auto max-w-lg">
            <button
              type="submit"
              data-testid="checkout-submit"
              disabled={loading || items.length === 0 || !canPick}
              className="w-full rounded-2xl bg-brand py-[15px] text-base font-semibold text-brand-paper disabled:opacity-50"
            >
              {loading ? 'Отправка...' : `Подтвердить · ${ctaWhen}`}
            </button>
            <p className="mt-1.5 text-center text-xs text-brand-dark/35">
              Оплата на месте при получении
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
