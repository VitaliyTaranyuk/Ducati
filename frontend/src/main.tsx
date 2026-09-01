import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import * as Sentry from '@sentry/react';
import './index.css';
import { Header } from './components/Header';
import { SyncButton } from './components/SyncButton';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { DrinkDetailPage } from './pages/DrinkDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { BaristaPage } from './pages/BaristaPage';
import { OwnerPage } from './pages/OwnerPage';
import { hasRemoteApi, initCsrf, authApi } from './lib/api';
import { useAuthStore } from './store';
import { useOfflineSync } from './hooks/useOfflineSync';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn, integrations: [Sentry.browserTracingIntegration()] });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

registerSW({ immediate: true });

function AppShell() {
  useOfflineSync();
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);

  useEffect(() => {
    let cancelled = false;
    const hasApi = hasRemoteApi();

    (async () => {
      if (!hasApi) {
        if (!cancelled) {
          setUser(null);
          setAuthReady(true);
        }
        return;
      }

      try {
        await initCsrf();
      } catch {
        // cookie may already exist
      }

      try {
        const { user } = await authApi.me();
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled && !useAuthStore.getState().user) {
          setUser(null);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();

    // Google Analytics
    const gaId = import.meta.env.VITE_GA_ID;
    if (gaId && typeof window.gtag === 'undefined') {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.async = true;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function (...args: unknown[]) {
        window.dataLayer.push(args);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId);
    }

    return () => {
      cancelled = true;
    };
  }, [setUser, setAuthReady]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/drink/:id" element={<DrinkDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/barista"
            element={
              <ProtectedRoute roles={['barista', 'owner']}>
                <BaristaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute roles={['owner']}>
                <OwnerPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <SyncButton />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
