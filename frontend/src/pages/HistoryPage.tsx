import { useState } from 'react';
import { ordersApi } from '../lib/api';
import type { Order } from '../types';

export function HistoryPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    const data = await ordersApi.history(phone.trim());
    setOrders(data.orders);
    setSearched(true);
  };

  const statusLabel: Record<string, string> = {
    pending: 'Ожидает',
    preparing: 'Готовится',
    ready: 'Готов',
    cancelled: 'Отменён',
    completed: 'Выдан',
  };

  return (
    <div className="px-4 pb-8">
      <h1 className="font-display text-2xl font-bold text-brand-dark mb-6">История заказов</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ваш телефон"
          className="flex-1 p-3 border border-brand-dark/15 rounded-xl bg-brand-paper"
        />
        <button type="submit" className="px-4 py-3 bg-brand text-brand-paper rounded-xl">
          Найти
        </button>
      </form>

      {searched && orders.length === 0 && (
        <p className="text-gray-500 text-center py-8">Заказы не найдены</p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-brand-paper rounded-xl p-4 shadow-sm border border-brand-dark/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</p>
                <p className="text-sm text-brand-dark/55">
                  {order.items
                    .map((i) => `${i.drinkName} (${i.volumeMl} мл)×${i.quantity}`)
                    .join(', ')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand">{order.total} ₽</p>
                <p className="text-xs text-gray-400">{statusLabel[order.status]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
