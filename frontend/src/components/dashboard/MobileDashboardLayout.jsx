import { AnimatePresence, motion } from "framer-motion";
import { FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { clearAuthSession } from "../../utils/session.js";
import { getInitials } from "../../utils/media.js";

function formatRole(role = "") {
  if (!role) {
    return "User";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function MobileDashboardLayout({
  activeSectionKey,
  children,
  items,
  sectionDescription,
  sectionTitle,
  user,
  workspaceDescription,
  workspaceTitle
}) {
  const navigate = useNavigate();

  function handleLogout() {
    clearAuthSession();
    toast.success("You have been logged out.");
    navigate("/", { replace: true });
  }

  function handleMenuItemClick(item) {
    navigate(item.path);
  }

  return (
    <div className="mobile-dashboard-shell">
      <div className="mobile-dashboard-app-frame">
        <div className="mobile-dashboard-topbar glass">
          <div className="mobile-dashboard-topbar-main">
            <div className="mobile-dashboard-avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </div>

            <div className="mobile-dashboard-topbar-copy">
              <p className="eyebrow">{workspaceTitle}</p>
              <h1>{sectionTitle}</h1>
              <p>{sectionDescription || workspaceDescription}</p>
            </div>
          </div>

          <div className="mobile-dashboard-topbar-side">
            <div className="mobile-dashboard-role-chip">
              <span>{formatRole(user?.role)}</span>
            </div>

            <button
              type="button"
              className="btn secondary mobile-dashboard-logout"
              onClick={handleLogout}
            >
              <FiLogOut aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {activeSectionKey === items[0]?.key ? (
          <section className="mobile-dashboard-summary glass">
            <div>
              <p className="eyebrow">Welcome Back</p>
              <h2>{user?.name || "NoAgentNaija User"}</h2>
            </div>
            <p>{workspaceDescription}</p>
          </section>
        ) : null}

        <div className="mobile-dashboard-content-wrap">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSectionKey}
              className="mobile-dashboard-section-content"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <nav className="mobile-bottom-nav glass" aria-label={`${workspaceTitle} sections`}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeSectionKey;

          return (
            <button
              key={item.key}
              type="button"
              className={isActive ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"}
              onClick={() => handleMenuItemClick(item)}
            >
              <Icon aria-hidden="true" />
              <span>{item.title}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
