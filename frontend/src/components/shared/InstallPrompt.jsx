import { useEffect, useMemo, useState } from "react";
import { FiChevronRight, FiDownload, FiShare2, FiX } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { usePwa } from "../../contexts/PwaContext.jsx";

function getPromptDelay(pathname) {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/landlord") ||
    pathname.startsWith("/renter") ||
    pathname.startsWith("/technician")
  ) {
    return 2200;
  }

  if (pathname.startsWith("/auth")) {
    return 4800;
  }

  return 9000;
}

export default function InstallPrompt() {
  const location = useLocation();
  const {
    canInstall,
    dismissInstallPrompt,
    installApp,
    installPromptOpen,
    isInstallSuppressed,
    isIosManualInstall,
    isStandalone,
    openInstallPrompt,
  } = usePwa();
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (
      !canInstall ||
      isStandalone ||
      isInstallSuppressed ||
      installPromptOpen
    ) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      openInstallPrompt();
    }, getPromptDelay(location.pathname));

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    canInstall,
    installPromptOpen,
    isInstallSuppressed,
    isStandalone,
    location.pathname,
    openInstallPrompt,
  ]);

  const promptCopy = useMemo(() => {
    if (isIosManualInstall) {
      return {
        description:
          "Add NoAgentNaija to your Home Screen for a full-screen app experience with faster reopening and offline support.",
        title: "Install on iPhone or iPad",
      };
    }

    return {
      description:
        "Install NoAgentNaija for a faster app shell, offline-ready public content, and a cleaner full-screen experience.",
      title: "Install NoAgentNaija",
    };
  }, [isIosManualInstall]);

  async function handleInstall() {
    setIsInstalling(true);

    try {
      await installApp();
    } finally {
      setIsInstalling(false);
    }
  }

  if (!installPromptOpen || !canInstall || isStandalone) {
    return null;
  }

  return (
    <div className="pwa-install-prompt" role="presentation">
      <div className="pwa-install-prompt-card glass">
        <button
          className="pwa-install-prompt-close"
          onClick={() => dismissInstallPrompt(true)}
          aria-label="Dismiss install prompt"
          type="button"
        >
          <FiX />
        </button>

        <div className="pwa-install-prompt-content">
          <div className="pwa-install-prompt-icon">
            <img src="/icon-192.png" alt="NoAgentNaija" />
          </div>

          <div className="pwa-install-prompt-copy">
            <p className="eyebrow">Installable App</p>
            <h2>{promptCopy.title}</h2>
            <p>{promptCopy.description}</p>
          </div>
        </div>

        {isIosManualInstall ? (
          <ol className="pwa-install-instructions">
            <li>
              Tap the <FiShare2 aria-hidden="true" /> Share button in Safari.
            </li>
            <li>
              Choose <strong>Add to Home Screen</strong>.
            </li>
            <li>Open NoAgentNaija from your Home Screen like a native app.</li>
          </ol>
        ) : null}

        <div className="pwa-install-prompt-actions">
          <button
            className="btn secondary"
            onClick={() => dismissInstallPrompt(true)}
            type="button"
            disabled={isInstalling}
          >
            Not now
          </button>
          <button
            className="btn primary"
            onClick={handleInstall}
            type="button"
            disabled={isInstalling}
          >
            {isIosManualInstall ? (
              <>
                <FiShare2 />
                Show Steps
              </>
            ) : isInstalling ? (
              "Preparing..."
            ) : (
              <>
                <FiDownload />
                Install App
                <FiChevronRight />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
