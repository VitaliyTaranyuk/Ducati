import { usePushNotifications } from '../hooks/usePushNotifications';

export function PushOptIn() {
  const { status, enable } = usePushNotifications();

  if (status === 'prompt') {
    return (
      <div className="mb-4 p-4 bg-brand/5 border border-brand/20 rounded-xl text-sm">
        <p className="font-semibold text-brand-dark mb-1">Уведомления о заказах</p>
        <p className="text-brand-dark/70 mb-3">Получать push, когда приходит новый заказ.</p>
        <button
          type="button"
          onClick={() => void enable()}
          className="px-4 py-2 bg-brand text-brand-paper rounded-lg text-sm"
        >
          Включить
        </button>
      </div>
    );
  }

  if (status === 'standalone-required') {
    return (
      <p className="mb-4 text-sm text-brand-dark/60">
        Push на iOS работает после установки на экран Домой.
      </p>
    );
  }

  if (status === 'denied') {
    return (
      <p className="mb-4 text-sm text-brand-dark/60">
        Уведомления запрещены в настройках браузера.
      </p>
    );
  }

  if (status === 'error') {
    return (
      <p className="mb-4 text-sm text-red-500">Не удалось подключить уведомления.</p>
    );
  }

  return null;
}
