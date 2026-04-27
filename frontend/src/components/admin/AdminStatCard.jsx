export default function AdminStatCard(props) {
  const StatIcon = props.icon;

  return (
    <article className="card stat-card metric-card">
      <div className="metric-card-header">
        <span className="metric-icon" aria-hidden="true">
          <StatIcon />
        </span>
        <p>{props.label}</p>
      </div>
      <strong>{props.value}</strong>
      {props.note ? <span className="metric-note">{props.note}</span> : null}
    </article>
  );
}
