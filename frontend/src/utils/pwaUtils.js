let swRegistration = null;
let reloadOnControllerChange = false;

function dispatchUpdateReady() {
  window.dispatchEvent(new CustomEvent("pwa:update-ready"));
}

function handleWaitingWorker(worker) {
  if (!worker || !navigator.serviceWorker.controller) {
    return;
  }

  dispatchUpdateReady();
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  if (swRegistration) {
    return swRegistration;
  }

  swRegistration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none"
  });

  handleWaitingWorker(swRegistration.waiting);

  swRegistration.addEventListener("updatefound", () => {
    const installingWorker = swRegistration?.installing;

    if (!installingWorker) {
      return;
    }

    installingWorker.addEventListener("statechange", () => {
      if (installingWorker.state === "installed") {
        handleWaitingWorker(swRegistration?.waiting || installingWorker);
      }
    });
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!reloadOnControllerChange) {
      return;
    }

    reloadOnControllerChange = false;
    window.location.reload();
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_UPDATE_READY") {
      dispatchUpdateReady();
    }
  });

  return swRegistration;
}

export function getServiceWorkerRegistration() {
  return swRegistration;
}

export async function checkForUpdates() {
  const registration = swRegistration || (await registerServiceWorker());

  if (!registration) {
    return false;
  }

  await registration.update();
  return Boolean(registration.waiting);
}

export async function applyServiceWorkerUpdate() {
  const registration = swRegistration || (await registerServiceWorker());
  const waitingWorker = registration?.waiting;

  if (!waitingWorker) {
    return false;
  }

  reloadOnControllerChange = true;
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
  return true;
}

export async function clearAllCaches() {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
  }

  if (!("caches" in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith("noagentnaija-"))
      .map((cacheName) => caches.delete(cacheName))
  );
}

export function warmRuntimeCache(urls = []) {
  if (!navigator.serviceWorker?.controller || urls.length === 0) {
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    type: "WARM_RUNTIME_CACHE",
    urls
  });
}

export async function schedulePublicDataRefresh() {
  const registration = swRegistration || (await registerServiceWorker());

  if (!registration?.sync) {
    return false;
  }

  try {
    await registration.sync.register("refresh-public-content");
    return true;
  } catch (error) {
    console.warn("Background sync registration failed:", error);
    return false;
  }
}

export function isRunningAsApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true
  );
}
