import { Link, useLocation } from 'react-router-dom';
import { publicUrl } from '../lib/assets';
import { useCartStore, useOfflineStore } from '../store';

export function Header() {
  const location = useLocation();
  const items = useCartStore((s) => s.items);
  const { isOnline, queueCount } = useOfflineStore();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const isClientRoute = !location.pathname.startsWith('/barista') && !location.pathname.startsWith('/owner');

  return (
    <header className="sticky top-0 z-50 bg-brand-paper/95 backdrop-blur border-b border-brand-dark/15 safe-top">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center min-w-0" aria-label="Дукати">
          <img
            src={publicUrl('logo.png')}
            alt="Дукати"
            className="h-14 w-14 shrink-0 block"
          />
        </Link>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <span className="text-xs bg-brand-accent text-brand-dark px-2 py-1 rounded-full">
              Офлайн{queueCount > 0 ? ` (${queueCount})` : ''}
            </span>
          )}
          {isClientRoute && (
            <Link
              to="/cart"
              className="relative p-2 rounded-full bg-brand text-brand-paper"
              aria-label="Корзина"
            >
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
