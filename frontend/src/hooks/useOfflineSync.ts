import { useEffect } from 'react';
import { useOfflineStore } from '../store';
import { getQueuedRequests, syncQueue } from '../lib/offlineQueue';
import { apiFetch, initCsrf } from '../lib/api';

async function processQueueItem(url: string, method: string, body: unknown): Promise<boolean> {
  try {
    await apiFetch(url, { method, body: JSON.stringify(body) });
    return true;
  } catch {
    return false;
  }
}

let syncInFlight: Promise<{ synced: number; failed: number }> | null = null;
let listenersBound = false;

async function refreshQueueCount() {
  const queue = await getQueuedRequests();
  useOfflineStore.getState().setQueueCount(queue.length);
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) return { synced: 0, failed: 0 };
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      await initCsrf();
      const result = await syncQueue(processQueueItem);
      await refreshQueueCount();
      return result;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

function bindNetworkListeners() {
  if (listenersBound || typeof window === 'undefined') return;
  listenersBound = true;

  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnline(true);
    void syncOfflineQueue();
  });
  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnline(false);
  });
}

export function useOfflineSync() {
  useEffect(() => {
    bindNetworkListeners();
    void refreshQueueCount();
    if (navigator.onLine) void syncOfflineQueue();
  }, []);

  return { sync: syncOfflineQueue, refreshQueueCount };
}

export function useIsStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}
