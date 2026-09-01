import { useIsStandalone } from '../hooks/useOfflineSync';

export function InstallPrompt() {
  const isStandalone = useIsStandalone();

  if (isStandalone) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="mx-4 mb-4 p-4 bg-brand/5 border border-brand/20 rounded-xl text-sm">
      <p className="font-semibold text-brand-dark mb-2">📱 Установить приложение</p>
      {isIOS ? (
        <p className="text-brand-dark/70">
          Safari → Поделиться <span className="inline-block">⬆️</span> → «На экран Домой»
        </p>
      ) : (
        <p className="text-brand-dark/70">
          Нажмите «Установить» в меню браузера или добавьте на главный экран
        </p>
      )}
    </div>
  );
}
