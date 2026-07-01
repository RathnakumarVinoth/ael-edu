export default function DashboardCard({ title, eyebrow, action, children, className = '' }) {
  return (
    <section className={`card dashboard-card ${className}`.trim()}>
      {(title || eyebrow || action) && (
        <div className="card-header">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h3>{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
