import { NavLink } from "react-router-dom";

export default function WorkspaceSidebar({
  brand,
  title,
  description,
  items,
  summary
}) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <p className="eyebrow">{brand}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <nav className="admin-nav" aria-label={`${title} sections`}>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "admin-nav-link active" : "admin-nav-link"
              }
            >
              <span className="admin-nav-icon" aria-hidden="true">
                <Icon />
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </NavLink>
          );
        })}
      </nav>

      {summary ? <div className="admin-sidebar-summary">{summary}</div> : null}
    </aside>
  );
}
