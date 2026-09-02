import { useEffect, useRef } from 'react';
import { flavorBadge, flavorImageUrl } from '../data/flavors';
import { formatPrice } from '../lib/menu';

interface Props {
  options: string[];
  value: string;
  onSelect: (name: string) => void;
  drinkId?: string;
  priceFor?: (name: string) => number;
}

export function FlavorPhotoTiles({ options, value, onSelect, drinkId, priceFor }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const skipAlign = useRef(true);

  useEffect(() => {
    skipAlign.current = true;
  }, [drinkId]);

  useEffect(() => {
    const row = scroller.current;
    const tile = row?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!row || !tile) return;
    if (skipAlign.current) {
      skipAlign.current = false;
      return;
    }
    const left = tile.offsetLeft - (row.clientWidth - tile.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [value]);

  return (
    <div
      ref={scroller}
      role="listbox"
      aria-labelledby="flavor-label"
      data-testid="flavor-film"
      className="mt-2 flex snap-x snap-proximity gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((opt) => {
        const imageUrl = flavorImageUrl(opt, drinkId);
        const selected = value === opt;
        const badge = flavorBadge(opt);
        return (
          <button
            key={opt}
            type="button"
            role="option"
            aria-selected={selected}
            data-testid="flavor-tile"
            onClick={() => onSelect(opt)}
            className={`relative isolate h-[6.75rem] w-[46%] min-w-[46%] shrink-0 snap-start overflow-hidden rounded-[14px] border-2 text-left transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              selected ? 'border-brand' : 'border-brand-dark/15'
            }`}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover bg-brand-accent" />
            ) : (
              <span className="absolute inset-0 bg-brand-accent" aria-hidden />
            )}
            {badge ? (
              <span
                data-testid="flavor-badge"
                className="absolute top-2 right-2 z-10 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-paper"
              >
                {badge}
              </span>
            ) : null}
            <span
              className={`absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-8 text-[13px] font-semibold text-brand-paper transition-colors duration-500 ${
                selected
                  ? 'bg-gradient-to-t from-brand to-transparent'
                  : 'bg-gradient-to-t from-brand-dark/90 to-transparent'
              }`}
            >
              {opt}
              {priceFor ? (
                <span className="mt-0.5 block text-xs font-semibold tabular-nums opacity-95">
                  {formatPrice(priceFor(opt))}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
