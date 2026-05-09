import api from "../api/axios.js";

function urlBase64ToUint8Array(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4 || 4)) % 4)}`;
  const binary = window.atob(padded);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function getPublicVapidKey() {
  return String(import.meta.env.VITE_VAPID_PUBLIC_KEY || "").trim();
}

export function isPushConfigurationReady() {
  return Boolean(getPublicVapidKey());
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    return (await Notification.requestPermission()) === "granted";
  }

  return false;
}

export function isNotificationSupported() {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

export function hasNotificationPermission() {
  return "Notification" in window && Notification.permission === "granted";
}

export async function subscribeToPushNotifications() {
  if (!isNotificationSupported() || !isPushConfigurationReady()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    await api.post("/notifications/subscribe", {
      subscription: existingSubscription.toJSON()
    });

    return existingSubscription;
  }

  const subscription = await registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(getPublicVapidKey()),
    userVisibleOnly: true
  });

  await api.post("/notifications/subscribe", {
    subscription: subscription.toJSON()
  });

  return subscription;
}

export async function unsubscribeFromPushNotifications() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  await api.post("/notifications/unsubscribe", {
    subscription: subscription.toJSON()
  });
  await subscription.unsubscribe();

  return true;
}

export async function isPushSubscribed() {
  if (!isNotificationSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return Boolean(subscription);
}

export function showLocalNotification(title, options = {}) {
  if (!hasNotificationPermission()) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) =>
      registration.showNotification(title, {
        badge: "/icon-96.png",
        icon: "/icon-192.png",
        ...options
      })
    )
    .catch((error) => {
      console.warn("Failed to show local notification:", error);
    });
}

export async function enableNotificationsForRole(role) {
  if (!isPushConfigurationReady()) {
    return false;
  }

  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return false;
  }

  const subscription = await subscribeToPushNotifications();

  if (!subscription) {
    return false;
  }

  await api.post(`/notifications/enable/${role}`);
  return true;
}

export async function disableNotificationsForRole(role) {
  await api.post(`/notifications/disable/${role}`);
  await unsubscribeFromPushNotifications().catch(() => false);
  return true;
}

export function createNotification(type, data = {}) {
  const baseNotification = {
    badge: "/icon-96.png",
    icon: "/icon-192.png",
    tag: `noagentnaija-${type}`
  };

  switch (type) {
    case "rent-reminder":
      return {
        ...baseNotification,
        body: data.body || "Your rent is due soon.",
        data: { type: "rent-reminder", url: "/renter" },
        title: data.title || "Rent Reminder"
      };
    case "maintenance-alert":
      return {
        ...baseNotification,
        body: data.body || "A maintenance task needs attention.",
        data: { type: "maintenance-alert", url: "/landlord" },
        title: data.title || "Maintenance Alert"
      };
    case "booking-confirmation":
      return {
        ...baseNotification,
        body: data.body || "A new service booking has been confirmed.",
        data: { type: "booking-confirmation", url: "/technician" },
        title: data.title || "Booking Confirmed"
      };
    case "admin-alert":
      return {
        ...baseNotification,
        body: data.body || "New platform activity needs review.",
        data: { type: "admin-alert", url: "/admin" },
        requireInteraction: true,
        title: data.title || "Admin Alert"
      };
    case "chat-message":
      return {
        ...baseNotification,
        body: data.message || "You have a new message.",
        data: {
          senderId: data.senderId,
          type: "chat-message",
          url: data.url || "/"
        },
        title: data.sender || "New Message"
      };
    default:
      return {
        ...baseNotification,
        body: data.body || "You have a new notification.",
        data: { type, url: data.url || "/" },
        title: data.title || "NoAgentNaija"
      };
  }
}

export function onNotificationClick(callback) {
  if (!("serviceWorker" in navigator)) {
    return () => {};
  }

  function handleMessage(event) {
    if (event.data?.type === "NOTIFICATION_CLICK") {
      callback(event.data.payload);
    }
  }

  navigator.serviceWorker.addEventListener("message", handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener("message", handleMessage);
  };
}
