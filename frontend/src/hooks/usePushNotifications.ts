import { useCallback, useEffect, useState } from 'react';
import { pushApi } from '../lib/api';
import { useAuthStore } from '../store';

export type PushStatus =
  | 'idle'
  | 'unsupported'
  | 'unconfigured'
  | 'standalone-required'
  | 'denied'
  | 'prompt'
  | 'subscribed'
  | 'error';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function canUsePush(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function isIosSafari(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

let subscribeInFlight: Promise<void> | null = null;

async function waitForServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) {
    await new Promise((r) => setTimeout(r, 400));
  }

  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('sw-timeout')), 8000);
  });

  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

async function subscribeAndRegister(): Promise<void> {
  if (subscribeInFlight) return subscribeInFlight;

  subscribeInFlight = (async () => {
    const { publicKey } = await pushApi.getVapidKey();
    if (!publicKey) throw new Error('unconfigured');

    const reg = await waitForServiceWorker();
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      } catch {
        const stale = await reg.pushManager.getSubscription();
        await stale?.unsubscribe();
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }
    }

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error('invalid subscription');
    }

    await pushApi.subscribe({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
  })();

  try {
    await subscribeInFlight;
  } finally {
    subscribeInFlight = null;
  }
}

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<PushStatus>('idle');
  const eligible = Boolean(user && ['barista', 'owner'].includes(user.role));

  useEffect(() => {
    if (!eligible) {
      setStatus('idle');
      return;
    }
    if (!canUsePush()) {
      setStatus('unsupported');
      return;
    }
    if (isIosSafari() && !isStandaloneDisplay()) {
      setStatus('standalone-required');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { publicKey } = await pushApi.getVapidKey();
        if (cancelled) return;
        if (!publicKey) {
          setStatus('unconfigured');
          return;
        }

        if (Notification.permission === 'denied') {
          setStatus('denied');
          return;
        }

        if (Notification.permission === 'granted') {
          await subscribeAndRegister();
          if (!cancelled) setStatus('subscribed');
          return;
        }

        setStatus('prompt');
      } catch (err) {
        console.warn('Push subscription failed:', err);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eligible, user?.id]);

  const enable = useCallback(async () => {
    if (!canUsePush()) {
      setStatus('unsupported');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setStatus(permission === 'denied' ? 'denied' : 'prompt');
      return;
    }
    try {
      await subscribeAndRegister();
      setStatus('subscribed');
    } catch (err) {
      console.warn('Push subscription failed:', err);
      setStatus('error');
    }
  }, []);

  return { status, enable };
}
