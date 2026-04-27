import { FiBarChart2, FiTrendingUp } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import {
  adminSections,
  formatCurrency,
  navOrder
} from "./adminConfig.js";

export default function AdminSidebar({ overview }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <p className="eyebrow">NoAgentNaija</p>
        <h2>Admin Console</h2>
        <p>Manage platform activity from one organized workspace.</p>
      </div>

      <nav className="admin-nav" aria-label="Admin sections">
        {navOrder.map((sectionKey) => {
          const section = adminSections[sectionKey];
          const Icon = section.icon;

          return (
            <NavLink
              key={sectionKey}
              to={section.path}
              end={sectionKey === "dashboard"}
              className={({ isActive }) =>
                isActive ? "admin-nav-link active" : "admin-nav-link"
              }
            >
              <span className="admin-nav-icon" aria-hidden="true">
                <Icon />
              </span>
              <span>
                <strong>{section.title}</strong>
                <small>{section.subtitle}</small>
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar-summary">
        <div className="admin-sidebar-pill">
          <FiTrendingUp />
          <span>{formatCurrency(overview.stats.revenue / 100)}</span>
        </div>
        <div className="admin-sidebar-pill">
          <FiBarChart2 />
          <span>{overview.stats.successfulTransactions} payments</span>
        </div>
      </div>
    </aside>
  );
}
