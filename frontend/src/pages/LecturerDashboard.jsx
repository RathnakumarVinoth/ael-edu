import { useEffect, useState } from 'react'
import { Award, ClipboardCheck, FileQuestion, TrendingUp, Users } from 'lucide-react'
import Badge from '../components/Badge'
import DashboardCard from '../components/DashboardCard'
import DataTable from '../components/DataTable'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import StatCard from '../components/StatCard'
import api from '../services/api'
import { formatDate, formatPercent, normalizeList, scoreVariant } from '../utils/formatters'

export default function LecturerDashboard() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/dashboard/lecturer/overview')
        setOverview(response.data)
      } catch {
        setError('Lecturer analytics could not be loaded right now.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <div className="page"><DashboardCard><LoadingSpinner label="Loading lecturer insights..." /></DashboardCard></div>
  }

  const weakTopics = normalizeList(overview?.weak_topics_summary)
  const topStudents = normalizeList(overview?.top_performing_students)
  const recentAssessments = normalizeList(overview?.recent_assessments)

  return (
    <div className="page">
      <PageHeader
        eyebrow="Instructional oversight"
        title="Lecturer Analytics Dashboard"
        subtitle="Monitor student performance, weak topics, and adaptive learning progress."
      />

      {error && <div className="card error-card">{error}</div>}

      <div className="stats-grid">
        <StatCard icon={<Users size={21} />} label="Total Students" value={overview?.total_students ?? 0} hint="Registered learners" />
        <StatCard icon={<FileQuestion size={21} />} label="Total Quizzes" value={overview?.total_quizzes ?? 0} hint="Active quiz inventory" />
        <StatCard icon={<ClipboardCheck size={21} />} label="Completed Assessments" value={overview?.total_assessments_completed ?? 0} hint="Learner submissions" />
        <StatCard icon={<TrendingUp size={21} />} label="Class Average" value={formatPercent(overview?.class_average_percentage, '0.0%')} hint="Overall cohort performance" />
      </div>

      <div className="content-grid two-col">
        <DashboardCard title="Weak Topics Summary" action={<Badge variant="danger">Intervention view</Badge>}>
          <DataTable
            data={weakTopics}
            emptyTitle="No topic summary data yet"
            emptyDescription="Topic performance summaries will appear after learner submissions."
            rowKey={(topic, index) => `${topic.topic_id}-${index}`}
            columns={[
              { key: 'topic_id', header: 'Topic', render: (topic) => `Topic ${topic.topic_id}` },
              { key: 'weak_count', header: 'Weak', render: (topic) => <Badge variant="danger">{topic.weak_count ?? 0}</Badge> },
              { key: 'moderate_count', header: 'Moderate', render: (topic) => <Badge variant="warning">{topic.moderate_count ?? 0}</Badge> },
              { key: 'strong_count', header: 'Strong', render: (topic) => <Badge variant="success">{topic.strong_count ?? 0}</Badge> },
            ]}
          />
        </DashboardCard>

        <DashboardCard title="Top Performing Students" action={<Award size={20} color="var(--primary)" />}>
          {topStudents.length > 0 ? (
            <ul className="stack-list">
              {topStudents.map((student, index) => (
                <li key={student} className="row-between">
                  <div>
                    <strong>Student {student}</strong>
                    <p className="stat-hint">High current assessment performance</p>
                  </div>
                  <Badge variant={index === 0 ? 'success' : 'primary'}>Rank {index + 1}</Badge>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No top performers yet" description="Completed assessments will populate this list." />}
        </DashboardCard>
      </div>

      <div className="content-grid two-col">
        <DashboardCard title="Class Performance Snapshot">
          <div className="mini-card">
            <div className="row-between">
              <span className="muted">Average performance</span>
              <strong>{formatPercent(overview?.class_average_percentage, '0.0%')}</strong>
            </div>
            <ProgressBar value={overview?.class_average_percentage || 0} label="Class average" />
            <p className="stat-hint">Completed assessments: {overview?.total_assessments_completed ?? 0}</p>
          </div>
          <div className="mini-card" style={{ marginTop: 12 }}>
            <div className="row-between">
              <strong>At-risk learners</strong>
              <Badge variant="danger">{normalizeList(overview?.at_risk_students).length}</Badge>
            </div>
            <p className="stat-hint">Students needing urgent support are identified through adaptive classification.</p>
          </div>
        </DashboardCard>

        <DashboardCard title="Recent Assessments">
          <DataTable
            data={recentAssessments}
            emptyTitle="No recent assessments"
            emptyDescription="Completed assessment sessions will appear here."
            rowKey={(item) => item.session_id}
            columns={[
              { key: 'session_id', header: 'Session', render: (item) => item.session_id },
              { key: 'student_id', header: 'Student', render: (item) => item.student_id },
              { key: 'quiz_id', header: 'Quiz', render: (item) => item.quiz_id },
              { key: 'percentage', header: 'Score', render: (item) => <Badge variant={scoreVariant(item.percentage)}>{formatPercent(item.percentage, '0.0%')}</Badge> },
              { key: 'completed_at', header: 'Completed At', render: (item) => formatDate(item.completed_at) },
            ]}
          />
        </DashboardCard>
      </div>
    </div>
  )
}
