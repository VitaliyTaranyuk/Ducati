import { useEffect, useId, useRef } from 'react';
import { SYRUP_NONE, SYRUPS, type SyrupOption } from '../data/syrups';

interface Props {
  open: boolean;
  selectedName: string | null;
  includedInPrice: boolean;
  price: number;
  onClose: () => void;
  onSelect: (name: string | null) => void;
}

function Thumb({ option }: { option: SyrupOption }) {
  if (!option.imageUrl) {
    return (
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-accent text-xl text-brand-dark/35"
        aria-hidden
      >
        —
      </span>
    );
  }
  return (
    <img
      src={option.imageUrl}
      alt=""
      className="h-14 w-14 shrink-0 rounded-xl object-cover bg-brand-accent"
    />
  );
}

export function SyrupModal({ open, selectedName, includedInPrice, price, onClose, onSelect }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = selectedName ?? SYRUP_NONE.id;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const pick = (option: SyrupOption) => {
    onSelect(option.id ? option.name : null);
    onClose();
  };

  const subtitle = includedInPrice ? 'Выберите вкус · входит в цену' : `Выберите вкус · +${price} ₽`;

  const rows: SyrupOption[] = [SYRUP_NONE, ...SYRUPS];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-brand-dark/40"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[82vh] w-full max-w-lg flex-col rounded-t-3xl bg-brand-paper"
      >
        <div className="flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-brand-dark/20" aria-hidden />
        </div>
        <div className="flex items-start justify-between px-4 pb-2 pt-3">
          <div>
            <h2 id={titleId} className="font-display text-2xl font-bold text-brand-dark">
              Сироп
            </h2>
            <p className="mt-0.5 text-sm text-brand-dark/55">{subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-brand-dark/50"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
          {rows.map((option, index) => {
            const selected = current === option.name || (option.id === SYRUP_NONE.id && !selectedName);
            return (
              <li key={option.id || 'none'}>
                {index > 0 && <div className="mx-3 border-t border-brand-dark/8" />}
                <button
                  type="button"
                  onClick={() => pick(option)}
                  aria-pressed={selected}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >
                  <Thumb option={option} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-brand-dark">{option.name}</span>
                    <span className="mt-0.5 block text-sm text-brand-dark/50">{option.description}</span>
                  </span>
                  <span
                    className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                      selected ? 'border-brand bg-brand' : 'border-brand-dark/25 bg-brand-paper'
                    }`}
                    aria-hidden
                  >
                    {selected && (
                      <span className="block h-full w-full rounded-full border-2 border-brand-paper" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
