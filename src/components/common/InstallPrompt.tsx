import React, { useEffect, useState, useCallback } from 'react';
import { Download, X, Share } from 'lucide-react';

const LS_KEY = 'todolist_install_prompt_dismissed';
const DISMISSED_UNTIL_KEY = 'todolist_install_dismissed_until';
// Show again after 7 days if dismissed with "Maybe Later"
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/** True only when running as an installed PWA */
function isRunningAsStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type Device = 'ios' | 'android' | 'other';

function detectDevice(): Device {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [device, setDevice] = useState<Device>('other');
  const [installing, setInstalling] = useState(false);

  // Capture the beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Determine whether to surface the prompt
  useEffect(() => {
    if (isRunningAsStandalone()) return; // Already installed — never show
    setDevice(detectDevice());

    // Check if user permanently dismissed
    if (localStorage.getItem(LS_KEY) === 'true') return;

    // Check if they chose "Maybe Later" and the cooldown hasn't expired
    const dismissedUntil = localStorage.getItem(DISMISSED_UNTIL_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    // Show after a short delay so it doesn't block initial interaction
    const timer = setTimeout(() => setShowPrompt(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem(LS_KEY, 'true');
        }
      } finally {
        setDeferredPrompt(null);
        setShowPrompt(false);
        setInstalling(false);
      }
    } else {
      // For iOS / unsupported — just close; instructions already visible
      setShowPrompt(false);
      localStorage.setItem(LS_KEY, 'true');
    }
  }, [deferredPrompt]);

  const handleMaybeLater = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DURATION_MS));
  }, []);

  const handleDismissPermanently = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem(LS_KEY, 'true');
  }, []);

  if (!showPrompt) return null;

  const isIOS = device === 'ios';
  // Show native install button when deferred prompt is available OR on Android
  const canUseNativePrompt = !!deferredPrompt;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-label="Install ToDoList app"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Install ToDoList</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Faster access, works offline</p>
            </div>
          </div>
          <button
            onClick={handleDismissPermanently}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS-specific instructions */}
        {isIOS && !canUseNativePrompt && (
          <div className="mx-4 mb-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              <span className="font-bold">To install on iOS:</span> tap the{' '}
              <Share className="inline w-3.5 h-3.5 align-text-bottom" /> <strong>Share</strong>{' '}
              button in Safari, then choose <strong>"Add to Home Screen"</strong>.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4 pt-1">
          {canUseNativePrompt ? (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              {installing ? 'Installing…' : 'Install App'}
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
            >
              Got it
            </button>
          )}
          <button
            onClick={handleMaybeLater}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-sm rounded-xl transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
