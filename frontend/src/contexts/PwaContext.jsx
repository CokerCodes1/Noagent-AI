import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyServiceWorkerUpdate,
  clearAllCaches,
  isRunningAsApp,
  registerServiceWorker,
  schedulePublicDataRefresh,
  warmRuntimeCache
} from "../utils/pwaUtils.js";

const DISMISS_KEY = "noagentnaija:pwa-install-dismissed-at";
const INSTALLED_KEY = "noagentnaija:pwa-installed";
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const APP_SHELL_URLS = ["/", "/auth", "/renter", "/landlord", "/technician", "/admin"];

const PwaContext = createContext(null);

function isIosSafari() {
  const userAgent = navigator.userAgent || "";
  const isAppleMobileDevice = /iPad|iPhone|iPod/i.test(userAgent);
  const isWebKitBrowser = /WebKit/i.test(userAgent);
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

  return isAppleMobileDevice && isWebKitBrowser && !isOtherIosBrowser;
}

function wasDismissedRecently() {
  const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

export function usePwa() {
  const context = useContext(PwaContext);

  if (!context) {
    throw new Error("usePwa must be used within a PwaProvider");
  }

  return context;
}

export function PwaProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installPromptOpen, setInstallPromptOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isStandalone, setIsStandalone] = useState(() => isRunningAsApp());
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  const supportsIosManualInstall = !isStandalone && isIosSafari();
  const isInstallSuppressed = wasDismissedRecently();
  const canInstall = Boolean(deferredPrompt) || supportsIosManualInstall;

  useEffect(() => {
    let isMounted = true;
    let mediaQuery;

    async function setupProgressiveEnhancements() {
      const registration = await registerServiceWorker();

      if (!isMounted || !registration) {
        return;
      }

      setServiceWorkerReady(true);
      warmRuntimeCache(APP_SHELL_URLS);
      schedulePublicDataRefresh();
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }

    function handleAppInstalled() {
      localStorage.setItem(INSTALLED_KEY, "true");
      localStorage.removeItem(DISMISS_KEY);
      setDeferredPrompt(null);
      setInstallPromptOpen(false);
      setIsStandalone(true);
    }

    function handleOnline() {
      setIsOnline(true);
      schedulePublicDataRefresh();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    function handleDisplayModeChange() {
      setIsStandalone(isRunningAsApp());
    }

    function handleUpdateReady() {
      setUpdateAvailable(true);
    }

    setupProgressiveEnhancements().catch((error) => {
      console.warn("Progressive enhancement setup failed:", error);
    });

    mediaQuery = window.matchMedia("(display-mode: standalone)");

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pwa:update-ready", handleUpdateReady);
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      isMounted = false;
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pwa:update-ready", handleUpdateReady);
      mediaQuery?.removeEventListener("change", handleDisplayModeChange);
    };
  }, [isStandalone]);

  const openInstallPrompt = useCallback(() => {
    if (!canInstall || isStandalone) {
      return false;
    }

    setInstallPromptOpen(true);
    return true;
  }, [canInstall, isStandalone]);

  const dismissInstallPrompt = useCallback((rememberDecision = true) => {
    if (rememberDecision) {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }

    setInstallPromptOpen(false);
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      setInstallPromptOpen(true);
      return { outcome: supportsIosManualInstall ? "manual" : "unavailable" };
    }

    setInstallPromptOpen(false);
    deferredPrompt.prompt();

    const choiceResult = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choiceResult.outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "true");
      localStorage.removeItem(DISMISS_KEY);
    }

    return choiceResult;
  }, [deferredPrompt, supportsIosManualInstall]);

  const refreshApp = useCallback(async () => {
    const updated = await applyServiceWorkerUpdate();

    if (updated) {
      setUpdateAvailable(false);
    }

    return updated;
  }, []);

  const clearAppCache = useCallback(async () => {
    await clearAllCaches();
    schedulePublicDataRefresh();
  }, []);

  const value = useMemo(
    () => ({
      canInstall,
      clearAppCache,
      deferredPrompt,
      dismissInstallPrompt,
      installApp,
      installPromptOpen,
      isInstallSuppressed,
      isIosManualInstall: supportsIosManualInstall,
      isOnline,
      isStandalone,
      openInstallPrompt,
      refreshApp,
      serviceWorkerReady,
      setInstallPromptOpen,
      updateAvailable
    }),
    [
      canInstall,
      clearAppCache,
      deferredPrompt,
      dismissInstallPrompt,
      installApp,
      installPromptOpen,
      isInstallSuppressed,
      isOnline,
      isStandalone,
      openInstallPrompt,
      refreshApp,
      serviceWorkerReady,
      supportsIosManualInstall,
      updateAvailable
    ]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
