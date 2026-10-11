import React, { useState, useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { RefreshCw, Sparkles } from 'lucide-react';

export const PwaUpdateBanner: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState<boolean>(false);
  const [updateFunction, setUpdateFunction] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const update = registerSW({
        onNeedRefresh() {
          setNeedRefresh(true);
        },
        onOfflineReady() {
          // PWA ist startklar für Offline-Betrieb
        },
        immediate: true
      });

      setUpdateFunction(() => update);

      // 1. Wenn die App aus dem Hintergrund geholt wird (z. B. auf iOS vom Home-Bildschirm)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          navigator.serviceWorker.getRegistration().then(reg => {
            reg?.update();
          });
        }
      };

      // 2. Regelmäßiger Check alle 60 Minuten
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
          reg?.update();
        });
      }, 60 * 60 * 1000);

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 flex items-center justify-between text-xs shadow-lg sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
        <span className="font-bold">Neue App-Version online verfügbar!</span>
      </div>
      <button
        onClick={() => {
          if (updateFunction) {
            updateFunction(true);
          } else {
            window.location.reload();
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-emerald-900 font-extrabold rounded-lg shadow-sm hover:bg-emerald-50 transition cursor-pointer active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Jetzt aktualisieren</span>
      </button>
    </div>
  );
};
