const SESSION_EVENT = "noagentnaija:session-change";

function notifySessionChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function setAuthSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", user.role);
  localStorage.setItem("user", JSON.stringify(user));
  notifySessionChange();
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  notifySessionChange();
}

export function getStoredUser() {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    clearAuthSession();
    return null;
  }
}

export function getStoredRole() {
  return localStorage.getItem("role");
}

export function updateStoredUser(updates) {
  const currentUser = getStoredUser();

  if (!currentUser) {
    return null;
  }

  const nextUser = {
    ...currentUser,
    ...updates
  };

  localStorage.setItem("user", JSON.stringify(nextUser));
  notifySessionChange();
  return nextUser;
}

export function subscribeToSessionChanges(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event) {
    if (!event.key || event.key === "user" || event.key === "role" || event.key === "token") {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

export function getDashboardPath(role) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "landlord") {
    return "/landlord";
  }

  if (role === "technician") {
    return "/technician";
  }

  return "/renter";
}
