export default function StatCard({ icon, label, value, hint }) {
  return (
    <div className="card stat-card">
      <div className="stat-card-top">
        <span className="stat-icon">{icon}</span>
        <p>{label}</p>
      </div>
      <strong>{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  )
}
