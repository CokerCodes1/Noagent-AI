export default function EmptyStateCard({
  action = null,
  className = "",
  description,
  icon: Icon = null,
  title
}) {
  return (
    <div className={`empty-state-card ${className}`.trim()}>
      {Icon ? (
        <div className="empty-state-icon" aria-hidden="true">
          <Icon />
        </div>
      ) : null}
      <div className="empty-state-copy">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="empty-state-actions">{action}</div> : null}
    </div>
  );
}
