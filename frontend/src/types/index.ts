export type DrinkSize = 'S' | 'M' | 'L';
export type DrinkCategory = 'classics' | 'special' | 'ice';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'cancelled' | 'completed';
export type UserRole = 'client' | 'barista' | 'owner';

export interface DrinkSizeOption {
  id: string;
  size: DrinkSize;
  price: number;
  volumeMl: number;
}

export interface Drink {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  category: DrinkCategory;
  badge: string | null;
  flavorOptions: string[];
  excludedModifierNames?: string[];
  sizes: DrinkSizeOption[];
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CartModifier {
  modifierId: string;
  name: string;
  price: number;
}

export interface CartItem {
  lineKey: string;
  drinkId: string;
  drinkName: string;
  size: DrinkSize;
  volumeMl: number;
  quantity: number;
  unitPrice: number;
  flavor?: string;
  syrup?: string;
  modifiers: CartModifier[];
}

export interface OrderItemModifier {
  id: string;
  modifierId: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  drinkId: string;
  drinkName: string;
  size: DrinkSize;
  volumeMl: number;
  flavor: string | null;
  syrup: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  modifiers: OrderItemModifier[];
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  comment: string | null;
  status: OrderStatus;
  readyAt: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: unknown;
  createdAt: string;
}
