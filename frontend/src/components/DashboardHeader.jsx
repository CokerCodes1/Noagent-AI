import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { clearAuthSession, getStoredUser } from "../utils/session.js";

export default function DashboardHeader({ title, subtitle }) {
  const navigate = useNavigate();
  const user = getStoredUser();

  function handleLogout() {
    clearAuthSession();
    toast.success("You have been logged out.");
    navigate("/", { replace: true });
  }

  return (
    <div className="dashboard-header">
      <div>
        <p className="eyebrow">{user?.role || "user"} dashboard</p>
        <h1>{title}</h1>
        {subtitle ? <p className="section-copy">{subtitle}</p> : null}
      </div>

      <div className="dashboard-header-actions">
        <div className="user-chip">
          <strong>{user?.name || "User"}</strong>
          <span>{user?.email || ""}</span>
        </div>
        <button type="button" className="btn secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
