import { useEffect, useState } from "react";
import { FiBell, FiDownload, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { usePwa } from "../../contexts/PwaContext.jsx";
import {
  disableNotificationsForRole,
  enableNotificationsForRole,
  hasNotificationPermission,
  isNotificationSupported,
  isPushConfigurationReady,
  isPushSubscribed,
  showLocalNotification
} from "../../utils/notificationUtils.js";
import { checkForUpdates } from "../../utils/pwaUtils.js";

export default function PwaSettings({ role }) {
  const { clearAppCache, isStandalone, openInstallPrompt, refreshApp, updateAvailable } = usePwa();
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [notificationsConfigured, setNotificationsConfigured] = useState(false);
  const [hasNotificationPermissions, setHasNotificationPermissions] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  useEffect(() => {
    setNotificationsSupported(isNotificationSupported());
    setNotificationsConfigured(isPushConfigurationReady());
    setHasNotificationPermissions(hasNotificationPermission());

    if (isNotificationSupported()) {
      isPushSubscribed().then(setIsSubscribed).catch(() => setIsSubscribed(false));
    }
  }, []);

  async function handleEnableNotifications() {
    setIsEnablingNotifications(true);

    try {
      const success = await enableNotificationsForRole(role);

      if (!success) {
        toast.error("Push notifications are not ready yet. Add a VAPID public key first.");
        return;
      }

      setHasNotificationPermissions(true);
      setIsSubscribed(true);
      toast.success("Notifications enabled successfully.");
      showLocalNotification("Notifications Enabled", {
        body: `NoAgentNaija will now deliver ${role} alerts to this device.`
      });
    } catch (error) {
      console.error("Failed to enable notifications:", error);
      toast.error("Failed to enable notifications.");
    } finally {
      setIsEnablingNotifications(false);
    }
  }

  async function handleDisableNotifications() {
    if (!window.confirm("Disable notifications on this device?")) {
      return;
    }

    setIsEnablingNotifications(true);

    try {
      await disableNotificationsForRole(role);
      setHasNotificationPermissions(false);
      setIsSubscribed(false);
      toast.success("Notifications disabled.");
    } catch (error) {
      console.error("Failed to disable notifications:", error);
      toast.error("Failed to disable notifications.");
    } finally {
      setIsEnablingNotifications(false);
    }
  }

  async function handleClearCache() {
    if (!window.confirm("Clear the cached app shell and offline files?")) {
      return;
    }

    setIsClearingCache(true);

    try {
      await clearAppCache();
      toast.success("App cache cleared.");
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast.error("Failed to clear cache.");
    } finally {
      setIsClearingCache(false);
    }
  }

  async function handleCheckUpdates() {
    setIsCheckingUpdates(true);

    try {
      const available = await checkForUpdates();

      if (available) {
        toast.info("A new app version is ready. Use Refresh now to load it.");
      } else {
        toast.info("You are already on the latest version.");
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      toast.error("Failed to check for updates.");
    } finally {
      setIsCheckingUpdates(false);
    }
  }

  return (
    <section className="dashboard-section pwa-settings-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">App Settings</p>
          <h2>Installed app controls</h2>
        </div>
        <p>Manage notifications, updates, and offline storage for this device.</p>
      </div>

      <div className="pwa-settings-section">
        <div className="pwa-settings-group section-card">
          <div className="pwa-settings-header">
            <FiBell />
            <h3>Push Notifications</h3>
          </div>

          {notificationsSupported ? (
            <div className="pwa-settings-content">
              {!notificationsConfigured ? (
                <p className="pwa-settings-hint">
                  Add `VITE_VAPID_PUBLIC_KEY` before enabling real push delivery in production.
                </p>
              ) : hasNotificationPermissions && isSubscribed ? (
                <div className="pwa-settings-enabled">
                  <p className="pwa-settings-status enabled">Notifications are enabled on this device.</p>
                  <button className="btn secondary" onClick={handleDisableNotifications} disabled={isEnablingNotifications}>
                    Disable Notifications
                  </button>
                </div>
              ) : (
                <div className="pwa-settings-disabled">
                  <p className="pwa-settings-status disabled">Notifications are currently turned off.</p>
                  <p className="pwa-settings-description">
                    This covers rent reminders, maintenance updates, technician leads, chat pings, and admin alerts.
                  </p>
                  <button className="btn primary" onClick={handleEnableNotifications} disabled={isEnablingNotifications}>
                    {isEnablingNotifications ? "Enabling..." : "Enable Notifications"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="pwa-settings-unsupported">
              Notifications are not supported in this browser.
            </p>
          )}
        </div>

        <div className="pwa-settings-group section-card">
          <div className="pwa-settings-header">
            <FiDownload />
            <h3>App Installation</h3>
          </div>

          <div className="pwa-settings-content">
            {isStandalone ? (
              <p className="pwa-settings-status enabled">This device is already running the installed app.</p>
            ) : (
              <div className="pwa-settings-disabled">
                <p className="pwa-settings-description">
                  Install NoAgentNaija to reopen faster in standalone mode without browser chrome.
                </p>
                <button className="btn secondary" type="button" onClick={() => openInstallPrompt()}>
                  Open Install Prompt
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pwa-settings-group section-card">
          <div className="pwa-settings-header">
            <FiRefreshCw />
            <h3>Updates & Cache</h3>
          </div>

          <div className="pwa-settings-content pwa-settings-actions">
            <button className="btn secondary" onClick={handleCheckUpdates} disabled={isCheckingUpdates}>
              {isCheckingUpdates ? "Checking..." : "Check for Updates"}
            </button>
            {updateAvailable ? (
              <button className="btn primary" type="button" onClick={() => refreshApp()}>
                Refresh Now
              </button>
            ) : null}
            <button className="btn secondary" onClick={handleClearCache} disabled={isClearingCache}>
              <FiTrash2 />
              {isClearingCache ? "Clearing..." : "Clear Cache"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
