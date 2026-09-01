import webpush from 'web-push';
import { config } from '../config/index.js';
import { prisma } from '../db/prisma.js';

let configured = false;

function isGoneEndpoint(err: unknown): boolean {
  const status = (err as { statusCode?: number })?.statusCode;
  return status === 404 || status === 410;
}

export function isPushConfigured(): boolean {
  return Boolean(config.vapid.publicKey && config.vapid.privateKey);
}

function ensureConfigured() {
  if (configured) return;
  if (!isPushConfigured()) return;
  try {
    webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey);
    configured = true;
  } catch (err) {
    console.warn('VAPID setup failed:', (err as Error).message);
  }
}

export async function sendPushToBaristas(payload: { title: string; body: string; url?: string }) {
  ensureConfigured();
  if (!configured) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { user: { role: { in: ['barista', 'owner'] } } },
  });

  const data = JSON.stringify(payload);
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data,
        );
      } catch (err) {
        if (isGoneEndpoint(err)) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
          return;
        }
        console.warn('Push send failed:', (err as Error).message);
      }
    }),
  );
}

export function getVapidPublicKey(): string {
  return config.vapid.publicKey;
}
