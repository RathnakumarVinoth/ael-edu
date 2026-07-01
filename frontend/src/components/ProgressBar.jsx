import { clampPercent, formatPercent } from '../utils/formatters'

export default function ProgressBar({ value = 0, variant = 'primary', label }) {
  const width = clampPercent(value)
  return (
    <div className="progress-block">
      {label && (
        <div className="progress-meta">
          <span>{label}</span>
          <strong>{formatPercent(width, '0.0%')}</strong>
        </div>
      )}
      <div className="progress-shell" aria-label={label || 'Progress'}>
        <div className={`progress-fill ${variant}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
