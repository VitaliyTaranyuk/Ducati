import { useRef } from 'react';
import { shopParts, shiftReadyAtHour, shiftReadyAtMinute } from '../lib/readyAt';
import { playWheelTick } from '../lib/wheelTick';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function MorphColumn({
  prev,
  current,
  next,
  ariaLabel,
  onNudge,
}: {
  prev: string;
  current: string;
  next: string;
  ariaLabel: string;
  onNudge: (dir: -1 | 1) => void;
}) {
  const lastY = useRef<number | null>(null);

  return (
    <div
      role="slider"
      aria-label={ariaLabel}
      aria-valuetext={current}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          onNudge(-1);
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          onNudge(1);
        }
      }}
      onWheel={(e) => {
        e.preventDefault();
        onNudge(e.deltaY > 0 ? 1 : -1);
      }}
      onPointerDown={(e) => {
        lastY.current = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (lastY.current == null) return;
        const dy = e.clientY - lastY.current;
        if (Math.abs(dy) >= 22) {
          onNudge(dy > 0 ? 1 : -1);
          lastY.current = e.clientY;
        }
      }}
      onPointerUp={() => {
        lastY.current = null;
      }}
      className="relative h-[108px] w-[72px] cursor-ns-resize overflow-hidden touch-none"
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={() => onNudge(-1)}
        className="flex h-7 w-full items-center justify-center text-[15px] tabular-nums text-brand-dark/18"
      >
        {prev}
      </button>
      <div className="flex h-[52px] items-center justify-center font-display text-[44px] font-bold tabular-nums tracking-[-0.03em] text-brand-dark">
        {current}
      </div>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => onNudge(1)}
        className="flex h-7 w-full items-center justify-center text-[15px] tabular-nums text-brand-dark/18"
      >
        {next}
      </button>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-paper via-transparent to-brand-paper"
        aria-hidden
      />
    </div>
  );
}

export function CheckoutTimeWheels({
  value,
  onChange,
  now,
}: {
  value: Date;
  onChange: (next: Date) => void;
  now: Date;
}) {
  const cur = shopParts(value);
  const hourPrev = shopParts(shiftReadyAtHour(value, -1, now));
  const hourNext = shopParts(shiftReadyAtHour(value, 1, now));
  const minPrev = shopParts(shiftReadyAtMinute(value, -1, now));
  const minNext = shopParts(shiftReadyAtMinute(value, 1, now));

  const nudge = (next: Date) => {
    if (next.getTime() === value.getTime()) return;
    onChange(next);
    playWheelTick();
  };

  return (
    <div
      data-testid="checkout-wheels"
      className="flex items-center justify-center gap-1.5"
    >
      <MorphColumn
        ariaLabel="Часы"
        prev={pad2(hourPrev.hour)}
        current={pad2(cur.hour)}
        next={pad2(hourNext.hour)}
        onNudge={(dir) => nudge(shiftReadyAtHour(value, dir, now))}
      />
      <span
        className="font-display pb-0.5 text-[36px] font-semibold text-brand-dark/33"
        aria-hidden
      >
        :
      </span>
      <MorphColumn
        ariaLabel="Минуты"
        prev={pad2(minPrev.minute)}
        current={pad2(cur.minute)}
        next={pad2(minNext.minute)}
        onNudge={(dir) => nudge(shiftReadyAtMinute(value, dir, now))}
      />
    </div>
  );
}
