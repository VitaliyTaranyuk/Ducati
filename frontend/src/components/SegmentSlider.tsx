import type { CSSProperties, ReactNode } from 'react';
import { volumeSliderLayout } from '../lib/volumeSlider';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  sublabel?: ReactNode;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  labelledBy?: string;
  testId?: string;
}

export function SegmentSlider<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  testId = 'segment-slider',
}: Props<T>) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const layout = volumeSliderLayout(options.length, selectedIndex);
  const interactive = layout.mode === 'multi';
  const style = {
    '--n': String(layout.slots),
    '--i': String(layout.knobIndex),
    '--pad-x': layout.sidePad ? `${layout.sidePad * 100}%` : '3px',
  } as CSSProperties;

  return (
    <div
      data-testid={testId}
      data-mode={layout.mode}
      data-slots={layout.slots}
      role={interactive ? 'radiogroup' : 'group'}
      aria-labelledby={labelledBy}
      className="seg-slide"
      style={style}
    >
      <span className="seg-knob" aria-hidden />
      <div className="seg-slots">
        {options.map((option) => {
          const selected = option.value === value;
          if (!interactive) {
            return (
              <div
                key={option.value}
                data-testid={`${testId}-option`}
                data-value={option.value}
                aria-current="true"
                className="flex min-h-[2.75rem] flex-col items-center justify-center px-1 py-2 font-sans font-semibold text-brand-dark"
              >
                <span className="block text-[13px] leading-tight">{option.label}</span>
                {option.sublabel != null && (
                  <span className="mt-0.5 block text-xs font-bold tabular-nums text-brand">
                    {option.sublabel}
                  </span>
                )}
              </div>
            );
          }
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={`${testId}-option`}
              data-value={option.value}
              onClick={() => onChange(option.value)}
              className={`flex min-h-[2.75rem] flex-col items-center justify-center px-1 py-2 font-sans ${
                selected ? 'font-semibold text-brand-dark' : 'text-brand-dark/55'
              }`}
            >
              <span className="block text-[13px] leading-tight">{option.label}</span>
              {option.sublabel != null && (
                <span className="mt-0.5 block text-xs font-bold tabular-nums text-brand">
                  {option.sublabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
