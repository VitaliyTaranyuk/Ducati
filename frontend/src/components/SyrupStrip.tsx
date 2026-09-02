import { SYRUP_NONE, SYRUPS, type SyrupOption } from '../data/syrups';

interface Props {
  selectedName: string | null;
  includedInPrice: boolean;
  price: number;
  onSelect: (name: string | null) => void;
}

function Tile({
  option,
  selected,
  priceLabel,
  onSelect,
}: {
  option: SyrupOption;
  selected: boolean;
  priceLabel: string;
  onSelect: () => void;
}) {
  const none = !option.imageUrl;
  return (
    <button
      type="button"
      data-testid="syrup-tile"
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative w-[76px] shrink-0 overflow-hidden rounded-[14px] border-2 text-center ${
        selected
          ? 'border-brand bg-brand text-brand-paper'
          : none
            ? 'border-brand-dark/15 bg-brand-accent text-brand-dark'
            : 'border-brand-dark/15 bg-brand-paper text-brand-dark'
      }`}
    >
      {option.imageUrl ? (
        <img
          src={option.imageUrl}
          alt=""
          className={`block h-12 w-full object-cover ${selected ? 'opacity-85' : ''}`}
        />
      ) : (
        <span className="flex h-12 items-center justify-center text-lg text-brand-dark/35" aria-hidden>
          —
        </span>
      )}
      <span className="block truncate px-1 pt-1 text-[10px] font-semibold">{none ? 'Классика' : option.name}</span>
      <span
        className={`block px-1 pb-1.5 text-[10px] font-bold tabular-nums ${
          selected ? 'text-brand-paper' : 'text-brand'
        }`}
      >
        {priceLabel}
      </span>
    </button>
  );
}

export function SyrupStrip({ selectedName, includedInPrice, price, onSelect }: Props) {
  const rows: SyrupOption[] = [SYRUP_NONE, ...SYRUPS];
  const extraLabel = includedInPrice ? 'в цене' : `+${price} ₽`;

  return (
    <div
      data-testid="syrup-strip"
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {rows.map((option) => {
        const none = !option.id;
        const selected = none ? !selectedName : selectedName === option.name;
        return (
          <Tile
            key={option.id || 'none'}
            option={option}
            selected={selected}
            priceLabel={none ? '0 ₽' : extraLabel}
            onSelect={() => onSelect(none ? null : option.name)}
          />
        );
      })}
    </div>
  );
}
