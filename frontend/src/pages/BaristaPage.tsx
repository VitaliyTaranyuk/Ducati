import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../lib/api';
import { PushOptIn } from '../components/PushOptIn';
import type { Order, OrderStatus } from '../types';

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'К приготовлению' },
  { key: 'ready', label: 'Готовые' },
] as const;

export function BaristaPage() {
  const [filter, setFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () => ordersApi.list(filter),
    refetchInterval: 15000,
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    await ordersApi.updateStatus(id, status);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
  };

  return (
    <div className="px-4 pb-8">
      <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">Заказы</h1>
      <PushOptIn />

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filter === f.key ? 'bg-brand text-brand-paper' : 'bg-brand-accent text-brand-dark'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-400">Загрузка...</p>}

      <div className="space-y-4">
        {data?.orders.map((order: Order) => (
          <div key={order.id} className="bg-brand-paper rounded-xl p-4 shadow-sm border-l-4 border-brand">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-lg">{order.customerName}</p>
                <p className="text-sm text-gray-500">{order.customerPhone}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                {order.status}
              </span>
            </div>

            <p className="text-sm font-medium text-brand">
              ⏰ {new Date(order.readyAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>

            <ul className="mt-2 text-sm space-y-1">
              {order.items.map((item) => {
                const extras = [
                  item.flavor,
                  item.syrup,
                  ...(item.modifiers ?? []).map((m) => m.name),
                ].filter(Boolean);
                return (
                  <li key={item.id}>
                    {item.drinkName} ({item.volumeMl} мл) × {item.quantity}
                    {extras.length ? ` · ${extras.join(', ')}` : ''}
                  </li>
                );
              })}
            </ul>

            {order.comment && (
              <p className="mt-2 text-sm text-gray-500 italic">💬 {order.comment}</p>
            )}

            <p className="mt-2 font-bold">{order.total} ₽</p>

            <div className="flex gap-2 mt-4">
              {order.status === 'pending' && (
                <button
                  onClick={() => updateStatus(order.id, 'preparing')}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm"
                >
                  В работу
                </button>
              )}
              {(order.status === 'pending' || order.status === 'preparing') && (
                <button
                  onClick={() => updateStatus(order.id, 'ready')}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm"
                >
                  Готов
                </button>
              )}
              {order.status === 'ready' && (
                <button
                  onClick={() => updateStatus(order.id, 'completed')}
                  className="flex-1 py-2 bg-brand text-white rounded-lg text-sm"
                >
                  Выдан
                </button>
              )}
              {!['cancelled', 'completed'].includes(order.status) && (
                <button
                  onClick={() => updateStatus(order.id, 'cancelled')}
                  className="py-2 px-3 bg-red-100 text-red-600 rounded-lg text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {data?.orders.length === 0 && !isLoading && (
        <p className="text-center text-gray-400 py-12">Нет активных заказов</p>
      )}
    </div>
  );
}
