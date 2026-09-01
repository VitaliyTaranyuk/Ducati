import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, User } from '../types';
import { cartLineKey, FALLBACK_VOLUME, lineUnitTotal } from '../lib/menu';
import type { DrinkSize } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'lineKey'> & { lineKey?: string }) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
}

function withKey(item: Omit<CartItem, 'lineKey'> & { lineKey?: string }): CartItem {
  const modifiers = item.modifiers ?? [];
  return {
    ...item,
    modifiers,
    lineKey: item.lineKey ?? cartLineKey({ ...item, modifiers }),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (raw) =>
        set((state) => {
          const item = withKey(raw);
          const existing = state.items.find((i) => i.lineKey === item.lineKey);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.lineKey === item.lineKey
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (lineKey) =>
        set((state) => ({
          items: state.items.filter((i) => i.lineKey !== lineKey),
        })),
      updateQuantity: (lineKey, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.lineKey !== lineKey)
              : state.items.map((i) => (i.lineKey === lineKey ? { ...i, quantity } : i)),
        })),
      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + lineUnitTotal(i) * i.quantity, 0),
    }),
    {
      name: 'ducati-cart',
      merge: (persisted, current) => {
        const p = persisted as { items?: Partial<CartItem>[] } | undefined;
        return {
          ...current,
          items: (p?.items ?? []).map((item) =>
            withKey({
              drinkId: String(item.drinkId),
              drinkName: String(item.drinkName ?? ''),
              size: (item.size as DrinkSize) ?? 'M',
              volumeMl: item.volumeMl ?? FALLBACK_VOLUME[(item.size as DrinkSize) ?? 'M'],
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              flavor: item.flavor,
              modifiers: item.modifiers ?? [],
            }),
          ),
        };
      },
    },
  ),
);

interface AuthState {
  user: User | null;
  authReady: boolean;
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authReady: false,
  setUser: (user) => set({ user }),
  setAuthReady: (authReady) => set({ authReady }),
}));

interface OfflineState {
  isOnline: boolean;
  queueCount: number;
  setOnline: (online: boolean) => void;
  setQueueCount: (count: number) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  queueCount: 0,
  setOnline: (online) => set({ isOnline: online }),
  setQueueCount: (count) => set({ queueCount: count }),
}));
