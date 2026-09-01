import { FALLBACK_DRINKS, FALLBACK_MODIFIERS } from '../data/catalog';
import type { DrinkCategory } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

/** GitHub Pages has no API unless VITE_API_URL is set at build time. */
export function hasRemoteApi(): boolean {
  return Boolean(import.meta.env.VITE_API_URL) || import.meta.env.BASE_URL === '/';
}

function useBundledCatalog(): boolean {
  return !hasRemoteApi();
}

function bundledDrinks(category?: DrinkCategory) {
  const drinks = category
    ? FALLBACK_DRINKS.filter((d) => d.category === category)
    : FALLBACK_DRINKS;
  return { drinks, version: 0 };
}

let csrfToken: string | null = null;

export async function initCsrf(): Promise<string> {
  if (!hasRemoteApi()) return '';
  const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken!;
}

function getCsrfFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Prefer the cookie — login rotates csrf_token while memory can stay stale. */
export function syncCsrfFromCookie(): string | null {
  const fromCookie = getCsrfFromCookie();
  if (fromCookie) csrfToken = fromCookie;
  return fromCookie;
}

async function ensureCsrf(): Promise<string> {
  const fromCookie = syncCsrfFromCookie();
  if (fromCookie) return fromCookie;
  if (csrfToken) return csrfToken;
  return initCsrf();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function parseError(res: Response): Promise<{ error?: string }> {
  return res.json().catch(() => ({ error: res.statusText }));
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const isMutating = Boolean(options.method && !['GET', 'HEAD'].includes(options.method));

  if (isMutating) {
    headers['X-CSRF-Token'] = await ensureCsrf();
  }

  const send = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    });

  let res = await send();

  // Auto-refresh on 401
  if (res.status === 401 && !path.includes('/auth/')) {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      if (isMutating) headers['X-CSRF-Token'] = await ensureCsrf();
      res = await send();
    }
  }

  if (res.status === 403 && isMutating) {
    const peek = await res.clone().json().catch(() => ({ error: '' as string }));
    if (peek.error === 'Invalid CSRF token') {
      headers['X-CSRF-Token'] = await initCsrf();
      res = await send();
    }
  }

  if (!res.ok) {
    const err = await parseError(res);
    throw new ApiError(res.status, err.error ?? 'Request failed');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const drinksApi = {
  list: async (category?: DrinkCategory) => {
    if (!useBundledCatalog()) {
      try {
        return await apiFetch<{ drinks: import('../types').Drink[]; version: number }>(
          `/drinks${category ? `?category=${category}` : ''}`,
        );
      } catch {
        /* preview without API, or GitHub Pages */
      }
    }
    return bundledDrinks(category);
  },
  get: async (id: string) => {
    if (!useBundledCatalog()) {
      try {
        return await apiFetch<{ drink: import('../types').Drink }>(`/drinks/${id}`);
      } catch (err) {
        const bundled = FALLBACK_DRINKS.find((d) => d.id === id);
        if (bundled) return { drink: bundled };
        throw err;
      }
    }
    const drink = FALLBACK_DRINKS.find((d) => d.id === id);
    if (!drink) throw new ApiError(404, 'Not found');
    return { drink };
  },
  adminAll: () => apiFetch<{ drinks: import('../types').Drink[] }>('/drinks/admin/all'),
  create: (data: unknown) =>
    apiFetch<{ drink: import('../types').Drink }>('/drinks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiFetch<{ drink: import('../types').Drink }>(`/drinks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiFetch<{ ok: boolean }>(`/drinks/${id}`, { method: 'DELETE' }),
};

export const modifiersApi = {
  list: async () => {
    if (!useBundledCatalog()) {
      try {
        return await apiFetch<{ modifiers: import('../types').Modifier[] }>('/modifiers');
      } catch {
        /* preview without API, or GitHub Pages */
      }
    }
    return { modifiers: FALLBACK_MODIFIERS };
  },
  adminAll: () => apiFetch<{ modifiers: import('../types').Modifier[] }>('/modifiers/admin/all'),
  create: (data: unknown) =>
    apiFetch<{ modifier: import('../types').Modifier }>('/modifiers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiFetch<{ modifier: import('../types').Modifier }>(`/modifiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiFetch<{ ok: boolean }>(`/modifiers/${id}`, { method: 'DELETE' }),
};

export const ordersApi = {
  create: (data: unknown) =>
    apiFetch<{ order: import('../types').Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: (status?: string) =>
    apiFetch<{ orders: import('../types').Order[] }>(
      `/orders${status ? `?status=${status}` : ''}`,
    ),
  updateStatus: (id: string, status: string) =>
    apiFetch<{ order: import('../types').Order }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  history: (phone: string) =>
    apiFetch<{ orders: import('../types').Order[] }>(`/orders/history?phone=${encodeURIComponent(phone)}`),
};

export const authApi = {
  login: async (email: string, password: string) => {
    const data = await apiFetch<{ user: import('../types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!syncCsrfFromCookie()) {
      await initCsrf().catch(() => {});
    }
    return data;
  },
  logout: () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => apiFetch<{ user: import('../types').User }>('/auth/me'),
};

export const statsApi = {
  get: (period: 'day' | 'week') => apiFetch<Record<string, unknown>>(`/stats?period=${period}`),
  exportUrl: (period: 'day' | 'week') => `/api/stats/export?period=${period}`,
};

export const pushApi = {
  getVapidKey: () => apiFetch<{ publicKey: string }>('/auth/vapid-public-key'),
  subscribe: (subscription: PushSubscriptionJSON) =>
    apiFetch<{ ok: boolean }>('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    }),
};
