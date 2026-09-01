import { useEffect, useId, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Subscriber = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const subscribers = new Set<Subscriber>();

function notify() {
  subscribers.forEach((fn) => fn());
}

function isStandaloneNow(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

function isIosDevice(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

function useInstallApp() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const onChange = () => rerender((n) => n + 1);
    subscribers.add(onChange);
    return () => {
      subscribers.delete(onChange);
    };
  }, []);

  const canShow = !isStandaloneNow() && !installed && (deferredPrompt !== null || isIosDevice());

  const promptInstall = async (): Promise<'native' | 'ios' | 'none'> => {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      notify();
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          installed = true;
          notify();
        }
      } catch {
        // Native prompt is one-shot; keep the CTA hidden.
      }
      return 'native';
    }
    if (isIosDevice()) return 'ios';
    return 'none';
  };

  return { canShow, promptInstall };
}

export function InstallPrompt() {
  const { canShow, promptInstall } = useInstallApp();
  const [iosHint, setIosHint] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hintId = useId();

  useEffect(() => {
    if (!iosHint) return;

    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current?.contains(event.target as Node)) return;
      setIosHint(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIosHint(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [iosHint]);

  if (!canShow) return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Установить приложение"
        aria-expanded={iosHint}
        aria-controls={iosHint ? hintId : undefined}
        onClick={() => {
          void promptInstall().then((mode) => {
            setIosHint(mode === 'ios' ? (open) => !open : false);
          });
        }}
        className="whitespace-nowrap text-xs font-medium px-2.5 py-1.5 rounded-full bg-brand/10 text-brand-dark border border-brand/20"
      >
        Установить
      </button>
      {iosHint && (
        <p
          id={hintId}
          role="status"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-[60] w-max max-w-[14rem] rounded-lg bg-brand-dark text-brand-paper text-xs px-3 py-2 shadow-lg"
        >
          Поделиться → «На экран Домой»
        </p>
      )}
    </div>
  );
}
