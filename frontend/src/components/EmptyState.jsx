import { Inbox } from 'lucide-react'

export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Inbox size={22} /></div>
      <h4>{title}</h4>
      {description && <p>{description}</p>}
    </div>
  )
}
