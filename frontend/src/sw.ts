/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

function scopedAsset(path: string): string {
  return new URL(path.replace(/^\//, ''), self.registration.scope).href;
}

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-v1',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/drinks') || url.pathname.startsWith('/api/modifiers'),
  new NetworkFirst({
    cacheName: 'api-menu-v1',
    networkTimeoutSeconds: 5,
  }),
);

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const fallback = {
        title: 'Кофейня Дукати',
        body: 'Новый заказ',
        url: scopedAsset('barista'),
      };
      let data = fallback;
      try {
        const parsed = event.data?.json() as { title?: string; body?: string; url?: string } | undefined;
        if (parsed && typeof parsed === 'object') {
          data = {
            title: parsed.title || fallback.title,
            body: parsed.body || fallback.body,
            url: parsed.url || fallback.url,
          };
        }
      } catch {
        const text = event.data?.text();
        if (text) data = { ...fallback, body: text };
      }

      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: scopedAsset('icon-192.png'),
        badge: scopedAsset('icon-192.png'),
        data: { url: data.url },
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? scopedAsset('barista');
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const origin = self.location.origin;
      const existing = all.find((client) => client.url.startsWith(origin));
      if (existing) {
        await existing.focus();
        if ('navigate' in existing) {
          await (existing as WindowClient).navigate(url);
        }
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
