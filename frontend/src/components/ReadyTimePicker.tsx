import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import {
  CLOSE_HOUR,
  OPEN_HOUR,
  combineReadyAt,
  formatReadyAtLabel,
  formatShopDay,
  hourSlots,
  minuteOptions,
  shiftReadyAtDay,
  shopParts,
  slotOf,
  snapReadyAt,
  type HourSlot,
} from '../lib/readyAt';

const ITEM_H = 44;
const VISIBLE = 3;
const WHEEL_H = ITEM_H * VISIBLE;
const PAD = ITEM_H * Math.floor(VISIBLE / 2);

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function slotKey(slot: HourSlot): string {
  return `${slot.dayOffset}-${slot.hour}`;
}

function WheelColumn({
  'aria-label': ariaLabel,
  children,
  selectedIndex,
  count,
  onSelect,
}: {
  'aria-label': string;
  children: ReactNode;
  selectedIndex: number;
  count: number;
  onSelect: (index: number) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const skip = useRef(false);
  const settle = useRef<number>();

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    skip.current = true;
    el.scrollTo({ top: selectedIndex * ITEM_H, behavior: 'auto' });
    const t = window.setTimeout(() => {
      skip.current = false;
    }, 80);
    return () => window.clearTimeout(t);
  }, [selectedIndex, count]);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  const pickFromScroll = () => {
    const el = scroller.current;
    if (!el || skip.current) return;
    const idx = Math.max(0, Math.min(count - 1, Math.round(el.scrollTop / ITEM_H)));
    if (idx !== selectedIndex) onSelect(idx);
  };

  return (
    <div
      className="relative w-[104px] overflow-hidden rounded-2xl border border-brand-dark/12 bg-brand-paper"
      style={{ height: WHEEL_H }}
    >
      <div
        className="pointer-events-none absolute inset-x-1.5 top-1/2 z-10 h-11 -translate-y-1/2 rounded-xl bg-brand-dark/[0.07]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-brand-paper to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-brand-paper to-transparent"
        aria-hidden
      />
      <div
        ref={scroller}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onScroll={() => {
          if (skip.current) return;
          window.clearTimeout(settle.current);
          settle.current = window.setTimeout(pickFromScroll, 70);
        }}
        className="overflow-y-auto overscroll-contain snap-y snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: WHEEL_H }}
      >
        <div style={{ height: PAD }} />
        {children}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
}

interface Props {
  value: Date;
  onChange: (next: Date) => void;
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-brand" aria-hidden>
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7.5v5l3.2 1.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReadyTimePicker({
  value,
  onChange,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
}: Props) {
  const now = useNow();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) setInternalOpen(next);
  };
  const slots = hourSlots(now);
  const currentSlot = slotOf(value, now);
  const daySlots = slots.filter((s) => s.dayOffset === currentSlot.dayOffset);
  const hourIndex = Math.max(
    0,
    daySlots.findIndex((s) => slotKey(s) === slotKey(currentSlot)),
  );
  const slot = daySlots[hourIndex] ?? daySlots[0] ?? slots[0];
  const minutes = slot ? minuteOptions(slot, now) : [];
  const parts = shopParts(value);
  const minuteIndex = Math.max(0, minutes.indexOf(parts.minute));
  const todayAvailable = slots.some((s) => s.dayOffset === 0);
  const tomorrowAvailable = slots.some((s) => s.dayOffset === 1);
  const canPick = Boolean(slot && minutes.length > 0);

  useEffect(() => {
    if (slots.length === 0) return;
    const snapped = snapReadyAt(value, now);
    if (snapped.getTime() !== value.getTime()) onChange(snapped);
  }, [now, onChange, slots.length, value]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const setDay = (dayOffset: 0 | 1) => {
    onChange(shiftReadyAtDay(value, dayOffset, now));
  };

  const setHour = (index: number) => {
    const nextSlot = daySlots[index];
    if (!nextSlot) return;
    const opts = minuteOptions(nextSlot, now);
    const minute = opts.includes(parts.minute) ? parts.minute : (opts[0] ?? 0);
    onChange(combineReadyAt(nextSlot, minute));
  };

  const setMinute = (index: number) => {
    const minute = minutes[index];
    if (minute == null) return;
    onChange(combineReadyAt(slot, minute));
  };

  const label = formatReadyAtLabel(value, now);

  const sheet =
    open && canPick && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <button
              type="button"
              className="absolute inset-0 bg-brand-dark/40"
              aria-label="Закрыть"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-testid="ready-time-sheet"
              className="relative z-10 w-full max-w-lg rounded-t-3xl bg-brand-creamLight px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2"
            >
              <div className="flex justify-center">
                <span className="h-1 w-10 rounded-full bg-brand-dark/20" aria-hidden />
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <h2 id={titleId} className="font-display text-2xl font-bold text-brand-dark">
                    К какому часу
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-dark/55">
                    Сегодня или завтра в часы работы кофейни
                  </p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-brand-dark/50"
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </div>

              <p className="sr-only" aria-live="polite">
                {label}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="День готовности">
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
                      disabled={!day.available}
                      aria-pressed={selected}
                      onClick={() => setDay(day.offset)}
                      className={`rounded-2xl px-2 py-3 text-center transition-colors ${
                        selected
                          ? 'border border-brand-dark bg-brand-paper text-brand-dark'
                          : 'border border-transparent bg-brand-dark/[0.06] text-brand-dark/70'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <span className="block text-[15px] font-semibold leading-tight">{day.label}</span>
                      <span className="mt-0.5 block text-[13px] font-normal text-brand-dark/45">
                        {formatShopDay(now, day.offset)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-center gap-3">
                <WheelColumn
                  aria-label="Часы"
                  selectedIndex={hourIndex}
                  count={daySlots.length}
                  onSelect={setHour}
                >
                  {daySlots.map((item, i) => (
                    <button
                      key={slotKey(item)}
                      type="button"
                      role="option"
                      aria-selected={i === hourIndex}
                      onClick={() => setHour(i)}
                      className={`snap-center w-full text-[22px] tabular-nums font-sans leading-none ${
                        i === hourIndex ? 'font-semibold text-brand-dark' : 'font-medium text-brand-dark/30'
                      }`}
                      style={{ height: ITEM_H }}
                    >
                      {pad2(item.hour)}
                    </button>
                  ))}
                </WheelColumn>
                <div className="pb-0.5 text-2xl font-semibold text-brand-dark/35" aria-hidden>
                  :
                </div>
                <WheelColumn
                  aria-label="Минуты"
                  selectedIndex={minuteIndex}
                  count={minutes.length}
                  onSelect={setMinute}
                >
                  {minutes.map((minute, i) => (
                    <button
                      key={minute}
                      type="button"
                      role="option"
                      aria-selected={i === minuteIndex}
                      onClick={() => setMinute(i)}
                      className={`snap-center w-full text-[22px] tabular-nums font-sans leading-none ${
                        i === minuteIndex ? 'font-semibold text-brand-dark' : 'font-medium text-brand-dark/30'
                      }`}
                      style={{ height: ITEM_H }}
                    >
                      {pad2(minute)}
                    </button>
                  ))}
                </WheelColumn>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-5 w-full rounded-2xl bg-brand py-3.5 text-base font-semibold text-brand-paper"
              >
                Готово · {label}
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  if (!canPick) {
    if (hideTrigger) return null;
    return (
      <div className="rounded-2xl border border-brand-dark/10 bg-brand-paper px-4 py-3">
        <p className="text-sm font-semibold text-brand-dark">Заказать к времени</p>
        <p className="mt-1 text-sm text-brand-dark/60">
          Сейчас нельзя выбрать время — кофейня работает с {pad2(OPEN_HOUR)}:00 до {pad2(CLOSE_HOUR)}:00.
        </p>
      </div>
    );
  }

  return (
    <>
      {hideTrigger ? null : (
      <button
        type="button"
        data-testid="ready-time-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-brand-dark/10 bg-brand-paper px-4 py-3.5 text-left transition-colors active:bg-brand-accent"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-accent">
          <ClockIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-brand-dark">Заказать к времени</span>
          <span className="mt-0.5 block text-[15px] font-medium tabular-nums text-brand">{label}</span>
          <span className="mt-0.5 block text-xs text-brand-dark/45">
            Нажмите, чтобы выбрать дату и час
          </span>
        </span>
        <span className="text-lg text-brand-dark/30" aria-hidden>
          ›
        </span>
      </button>
      )}
      {sheet}
    </>
  );
}
