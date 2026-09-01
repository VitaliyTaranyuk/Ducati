import { useOfflineStore } from '../store';
import { syncOfflineQueue } from '../hooks/useOfflineSync';

export function SyncButton() {
  const { isOnline, queueCount } = useOfflineStore();

  if (queueCount === 0) return null;

  return (
    <button
      onClick={() => void syncOfflineQueue()}
      disabled={!isOnline}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand text-white px-6 py-3 rounded-full shadow-lg disabled:opacity-50"
    >
      {isOnline ? `Синхронизировать (${queueCount})` : 'Ожидание сети...'}
    </button>
  );
}
