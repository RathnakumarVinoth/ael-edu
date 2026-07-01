export const emptyText = 'Not available'

export function isPresent(value) {
  return value !== null && value !== undefined && value !== ''
}

export function displayValue(value, fallback = emptyText) {
  return isPresent(value) ? value : fallback
}

export function formatPercent(value, fallback = 'Not calculated yet') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback
  }
  return `${Number(value).toFixed(1)}%`
}

export function formatNumber(value, fallback = 'Not calculated yet') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback
  }
  return Number(value).toFixed(1)
}

export function formatDate(value) {
  if (!value) return emptyText
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return emptyText
  return date.toLocaleString()
}

export function clampPercent(value) {
  const number = Number(value || 0)
  return Math.max(0, Math.min(100, number))
}

export function scoreVariant(value) {
  const score = Number(value || 0)
  if (score >= 85) return 'success'
  if (score >= 70) return 'primary'
  if (score >= 55) return 'warning'
  if (score >= 40) return 'orange'
  return 'danger'
}

export function difficultyVariant(level) {
  const value = String(level || '').toLowerCase()
  if (value === 'easy') return 'success'
  if (value === 'medium') return 'primary'
  if (value === 'hard') return 'orange'
  if (value === 'advanced') return 'purple'
  return 'neutral'
}

export function priorityVariant(priority) {
  const value = String(priority || '').toLowerCase()
  if (value === 'high') return 'danger'
  if (value === 'medium') return 'orange'
  if (value === 'low') return 'success'
  return 'neutral'
}

export function masteryVariant(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'strong') return 'success'
  if (value === 'moderate') return 'warning'
  if (value === 'weak') return 'danger'
  return 'neutral'
}

export function categoryVariant(category) {
  const value = String(category || '').toLowerCase()
  if (value.includes('advanced')) return 'success'
  if (value.includes('good')) return 'primary'
  if (value.includes('average')) return 'warning'
  if (value.includes('weak')) return 'orange'
  if (value.includes('risk')) return 'danger'
  return 'neutral'
}

export function normalizeList(data) {
  return Array.isArray(data) ? data : []
}
