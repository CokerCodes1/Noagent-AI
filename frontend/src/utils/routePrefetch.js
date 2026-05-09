const routeLoaders = {
  "/": () => import("../pages/HomePage.jsx"),
  "/auth": () => import("../pages/Auth.jsx"),
  "/renter": () => import("../pages/RenterDashboard.jsx"),
  "/landlord": () => import("../pages/LandlordDashboard.jsx"),
  "/technician": () => import("../pages/TechnicianDashboard.jsx"),
  "/admin": () => import("../pages/AdminDashboard.jsx"),
  "/payment-success": () => import("../pages/PaymentSuccess.jsx")
};

function normalizePath(path = "/") {
  if (path === "/" || path.startsWith("/?")) {
    return "/";
  }

  const matchedPath = Object.keys(routeLoaders).find(
    (knownPath) => knownPath !== "/" && path.startsWith(knownPath)
  );

  return matchedPath || path;
}

export function prefetchRoute(path) {
  const loader = routeLoaders[normalizePath(path)];

  if (!loader) {
    return Promise.resolve();
  }

  return loader().catch(() => {});
}
