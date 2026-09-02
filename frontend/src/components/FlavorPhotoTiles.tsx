import { flavorImageUrl } from '../data/flavors';
import { formatPrice } from '../lib/menu';

interface Props {
  options: string[];
  value: string;
  onSelect: (name: string) => void;
  drinkId?: string;
  priceFor?: (name: string) => number;
}

export function FlavorPhotoTiles({ options, value, onSelect, drinkId, priceFor }: Props) {
  return (
    <div
      role="listbox"
      aria-labelledby="flavor-label"
      data-testid="flavor-film"
      className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((opt) => {
        const imageUrl = flavorImageUrl(opt, drinkId);
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="option"
            aria-selected={selected}
            data-testid="flavor-tile"
            onClick={() => onSelect(opt)}
            className={`relative isolate h-[6.75rem] w-[46%] min-w-[46%] shrink-0 overflow-hidden rounded-[14px] border-2 text-left ${
              selected ? 'border-brand' : 'border-brand-dark/15'
            }`}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover bg-brand-accent" />
            ) : (
              <span className="absolute inset-0 bg-brand-accent" aria-hidden />
            )}
            <span
              className={`absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-8 text-[13px] font-semibold text-brand-paper ${
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
