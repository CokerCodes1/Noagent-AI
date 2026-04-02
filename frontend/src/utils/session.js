export function setAuthSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", user.role);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
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

export function getDashboardPath(role) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "landlord") {
    return "/landlord";
  }

  return "/renter";
}
