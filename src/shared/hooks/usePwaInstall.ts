/**
 * هوك إدارة تثبيت تطبيق الويب كـ PWA على الشاشة الرئيسية (Add to Home Screen).
 * يدعم Android و Chromium عبر حدث beforeinstallprompt، ويوفر إرشادات سهلة لـ iOS Safari.
 */
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

interface BeforeInstallPromptEvent {
  preventDefault: () => void;
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface WebWindow {
  addEventListener?: (type: string, listener: (e: any) => void) => void;
  removeEventListener?: (type: string, listener: (e: any) => void) => void;
  matchMedia?: (query: string) => { matches: boolean };
  navigator?: {
    userAgent?: string;
    standalone?: boolean;
  };
  document?: {
    referrer?: string;
  };
  sessionStorage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
}

function getWebWindow(): WebWindow | null {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined') return null;
  return globalThis as unknown as WebWindow;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

const win = getWebWindow();
if (win?.addEventListener) {
  win.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    deferredPrompt = e;
    notifyListeners();
  });

  win.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export function isPwaStandalone(): boolean {
  if (Platform.OS !== 'web') return true;
  const w = getWebWindow();
  if (!w) return false;
  return Boolean(
    w.matchMedia?.('(display-mode: standalone)')?.matches ||
    w.navigator?.standalone === true ||
    w.document?.referrer?.includes('android-app://')
  );
}

export function isIosDevice(): boolean {
  if (Platform.OS !== 'web') return false;
  const w = getWebWindow();
  const ua = w?.navigator?.userAgent?.toLowerCase() ?? '';
  return /iphone|ipad|ipod/.test(ua);
}

const STORAGE_DISMISSED_KEY = 'pwa_install_banner_dismissed_session';

export function usePwaInstall() {
  const [hasPrompt, setHasPrompt] = useState<boolean>(Boolean(deferredPrompt));
  const [isInstalled, setIsInstalled] = useState<boolean>(isPwaStandalone());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    const w = getWebWindow();
    try {
      return w?.sessionStorage?.getItem(STORAGE_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      setHasPrompt(Boolean(deferredPrompt));
      setIsInstalled(isPwaStandalone());
    };

    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const isIos = isIosDevice();
  const canInstall = !isInstalled && (hasPrompt || isIos || Platform.OS === 'web');

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'unsupported'> => {
    if (isIos) {
      setShowIosGuide(true);
      return 'ios';
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          deferredPrompt = null;
          setIsInstalled(true);
          setHasPrompt(false);
          return 'accepted';
        }
        return 'dismissed';
      } catch {
        return 'unsupported';
      }
    }

    setShowIosGuide(true);
    return 'unsupported';
  }, [isIos]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    const w = getWebWindow();
    try {
      w?.sessionStorage?.setItem(STORAGE_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  return {
    canInstall,
    isInstalled,
    isDismissed,
    isIos,
    showIosGuide,
    setShowIosGuide,
    promptInstall,
    dismiss,
  };
}
