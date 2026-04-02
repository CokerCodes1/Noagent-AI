import { Navigate, useLocation } from "react-router-dom";
import { getDashboardPath, getStoredRole } from "../utils/session.js";

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = getStoredRole();

  if (!token || !role) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return children;
}
