import DashboardCard from './DashboardCard'

export default function FormCard({ title, eyebrow, children, className = '' }) {
  return (
    <DashboardCard title={title} eyebrow={eyebrow} className={`form-card ${className}`.trim()}>
      {children}
    </DashboardCard>
  )
}
