import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BookOpen, ClipboardCheck, FileQuestion, Layers, Settings, TrendingUp, Users } from 'lucide-react'
import Badge from '../components/Badge'
import DashboardCard from '../components/DashboardCard'
import DataTable from '../components/DataTable'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import api from '../services/api'
import { formatPercent, normalizeList, scoreVariant } from '../utils/formatters'

const quickLinks = [
  { to: '/courses', label: 'Course Management', icon: BookOpen },
  { to: '/topics', label: 'Topic Management', icon: Layers },
  { to: '/questions', label: 'Question Bank', icon: FileQuestion },
  { to: '/quizzes', label: 'Quiz Management', icon: ClipboardCheck },
]

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/dashboard/lecturer/overview')
        setOverview(response.data)
      } catch {
        setError('System overview could not be loaded right now.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <div className="page"><DashboardCard><LoadingSpinner label="Loading administration view..." /></DashboardCard></div>
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="System administration"
        title="Admin Operations Dashboard"
        subtitle="A concise platform overview for monitoring learning activities and instructional operations."
      />

      {error && <div className="card error-card">{error}</div>}

      <div className="stats-grid">
        <StatCard icon={<Users size={21} />} label="Students" value={overview?.total_students ?? 0} hint="Registered learners" />
        <StatCard icon={<ClipboardCheck size={21} />} label="Quizzes" value={overview?.total_quizzes ?? 0} hint="Current quiz inventory" />
        <StatCard icon={<Settings size={21} />} label="Completed Assessments" value={overview?.total_assessments_completed ?? 0} hint="Submission count" />
        <StatCard icon={<TrendingUp size={21} />} label="Class Average" value={formatPercent(overview?.class_average_percentage, '0.0%')} hint="Cohort performance" />
      </div>

      <div className="content-grid two-col">
        <DashboardCard title="System Overview" action={<Badge variant="primary">Research prototype</Badge>}>
          <div className="mini-card">
            <h4>Platform health snapshot</h4>
            <p className="page-subtitle">Faculty and student activity are summarized here for demonstration, supervisor review, and intervention planning.</p>
          </div>
          <div className="card-grid" style={{ marginTop: 12 }}>
            <div className="mini-card"><strong>{normalizeList(overview?.weak_students).length}</strong><p className="stat-hint">Weak students flagged</p></div>
            <div className="mini-card"><strong>{normalizeList(overview?.at_risk_students).length}</strong><p className="stat-hint">At-risk students flagged</p></div>
          </div>
        </DashboardCard>

        <DashboardCard title="Quick Links">
          <div className="stack-list">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.to} to={item.to} className="quick-link">
                  <span className="row-between" style={{ justifyContent: 'flex-start' }}><Icon size={19} /> {item.label}</span>
                  <Badge variant="neutral">Open</Badge>
                </Link>
              )
            })}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Recent Cohort Performance">
        {normalizeList(overview?.recent_assessments).length ? (
          <DataTable
            data={normalizeList(overview?.recent_assessments).slice(0, 6)}
            rowKey={(item) => item.session_id}
            columns={[
              { key: 'session_id', header: 'Session', render: (item) => item.session_id },
              { key: 'student_id', header: 'Student', render: (item) => item.student_id },
              { key: 'quiz_id', header: 'Quiz', render: (item) => item.quiz_id },
              { key: 'percentage', header: 'Score', render: (item) => <Badge variant={scoreVariant(item.percentage)}>{formatPercent(item.percentage, '0.0%')}</Badge> },
            ]}
          />
        ) : <EmptyState title="No recent assessment activity" description="Cohort activity will appear after learner submissions." />}
      </DashboardCard>
    </div>
  )
}
