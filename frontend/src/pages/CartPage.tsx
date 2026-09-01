import { Link } from 'react-router-dom';
import { useCartStore } from '../store';
import { formatItemExtras, formatVolume, lineUnitTotal } from '../lib/menu';

export function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCartStore();

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

  return (
    <div className="px-4 pb-32">
      <h1 className="font-display text-2xl font-bold text-brand-dark mb-6">Корзина</h1>

      <div className="space-y-4">
        {items.map((item) => {
          const extras = formatItemExtras(item);
          const unit = lineUnitTotal(item);
          return (
            <div
              key={item.lineKey}
              className="bg-brand-paper rounded-xl p-4 shadow-sm border border-brand-dark/10 flex justify-between items-center"
            >
              <div className="min-w-0 pr-2">
                <p className="font-medium">{item.drinkName}</p>
                <p className="text-sm text-brand-dark/55 font-sans">
                  {formatVolume(item.volumeMl)} · {unit} ₽
                </p>
                {extras && <p className="text-xs text-brand mt-1">{extras}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.lineKey, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-brand-accent"
                >
                  −
                </button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.lineKey, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-brand-accent"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.lineKey)}
                  className="text-red-400 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-brand-paper border-t border-brand-dark/15 p-4 safe-bottom">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <div>
            <p className="text-sm text-brand-dark/55">Итого</p>
            <p className="text-2xl font-sans font-bold text-brand">{total()} ₽</p>
          </div>
          <Link
            to="/checkout"
            className="px-8 py-3 bg-brand text-brand-paper rounded-2xl font-semibold"
          >
            Оформить
          </Link>
        </div>
      </div>
    </div>
  );
}
