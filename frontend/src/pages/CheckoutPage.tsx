import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useOfflineStore } from '../store';
import { ordersApi } from '../lib/api';
import { enqueueRequest } from '../lib/offlineQueue';
import { formatItemExtras, formatVolume, lineUnitTotal } from '../lib/menu';
import { formatReadyAtLabel, readStoredReadyAt, snapReadyAt } from '../lib/readyAt';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCartStore();
  const { isOnline, setQueueCount } = useOfflineStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [queued, setQueued] = useState(false);

  const readyAtDate = readStoredReadyAt();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      customerName: name.trim(),
      customerPhone: phone.trim(),
      comment: comment.trim() || undefined,
      readyAt: snapReadyAt(readStoredReadyAt()).toISOString(),
      items: items.map((i) => ({
        drinkId: i.drinkId,
        size: i.size,
        quantity: i.quantity,
        flavor: i.flavor,
        syrup: i.syrup,
        modifiers: i.modifiers.map((m) => ({ modifierId: m.modifierId })),
      })),
    };

    try {
      if (isOnline) {
        await ordersApi.create(payload);
        setSuccess(true);
      } else {
        await enqueueRequest('/orders', 'POST', payload);
        const queue = await import('../lib/offlineQueue').then((m) => m.getQueuedRequests());
        setQueueCount(queue.length);
        setQueued(true);
      }
      clear();
      sessionStorage.removeItem('readyAt');
    } catch {
      await enqueueRequest('/orders', 'POST', payload);
      const queue = await import('../lib/offlineQueue').then((m) => m.getQueuedRequests());
      setQueueCount(queue.length);
      setQueued(true);
      clear();
    } finally {
      setLoading(false);
    }
  };

  if (success || queued) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="text-5xl mb-4">{queued ? '📤' : '✅'}</div>
        <h1 className="font-display text-2xl font-bold text-brand-dark">
          {queued ? 'Заказ сохранён' : 'Заказ принят!'}
        </h1>
        <p className="text-brand-dark/60 mt-2">
          {queued
            ? 'Будет отправлен при подключении к сети'
            : 'Оплата на месте при получении'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-brand text-brand-paper rounded-2xl"
        >
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8">
      <h1 className="font-display text-2xl font-bold text-brand-dark mb-6">Оформление</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Имя *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full p-3 border border-brand-dark/15 rounded-xl bg-brand-paper"
            placeholder="Как к вам обращаться"
            maxLength={100}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Телефон *</label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full p-3 border border-brand-dark/15 rounded-xl bg-brand-paper"
            placeholder="+7 (999) 123-45-67"
            maxLength={20}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Комментарий</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 w-full p-3 border border-brand-dark/15 rounded-xl bg-brand-paper"
            rows={3}
            placeholder="Без сахара, с собой..."
            maxLength={500}
          />
        </div>

        <div className="bg-brand-accent rounded-xl p-4 space-y-2">
          {items.map((item) => {
            const extras = formatItemExtras(item);
            return (
              <div key={item.lineKey} className="text-sm text-brand-dark/80">
                {item.drinkName} · {formatVolume(item.volumeMl)} × {item.quantity}
                {extras ? ` · ${extras}` : ''} — {lineUnitTotal(item) * item.quantity} ₽
              </div>
            );
          })}
          <p className="text-sm font-semibold text-brand-dark pt-1 border-t border-brand-dark/10">
            {items.length} поз. · {total()} ₽
          </p>
          <p className="text-sm text-brand-dark/60">
            Готовность: {formatReadyAtLabel(readyAtDate)}
          </p>
          <p className="text-xs text-brand-dark/40">Оплата на месте</p>
        </div>

        {!isOnline && (
          <p className="text-amber-700 text-sm">
            ⚠️ Нет сети — заказ будет сохранён и отправлен позже
          </p>
        )}

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full py-4 bg-brand text-brand-paper rounded-2xl font-semibold disabled:opacity-50"
        >
          {loading ? 'Отправка...' : 'Подтвердить заказ'}
        </button>
      </form>
    </div>
  );
}
