import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import api from '../services/api'

export default function LecturerDashboard() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/dashboard/lecturer/overview')
        setOverview(response.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <div className="page"><div className="card"><LoadingSpinner label="Loading lecturer insights…" /></div></div>
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Instructional oversight"
        title="Lecturer Analytics Dashboard"
        subtitle="Monitor student performance, risk levels, weak topics, and adaptive learning progress."
      />

      <div className="stats-grid">
        <StatCard icon="👩‍🎓" label="Total students" value={overview?.total_students ?? 0} hint="Registered learners" />
        <StatCard icon="📝" label="Total quizzes" value={overview?.total_quizzes ?? 0} hint="Authoring inventory" />
        <StatCard icon="✅" label="Completed assessments" value={overview?.total_assessments_completed ?? 0} hint="Learner submissions" />
        <StatCard icon="📊" label="Class average" value={`${Number(overview?.class_average_percentage ?? 0).toFixed(1)}%`} hint="Overall cohort performance" />
      </div>

      <div className="content-grid two-col">
        <div className="card">
          <h3>Class performance summary</h3>
          <div className="card info-card" style={{ marginTop: 12 }}>
            <div className="row-between">
              <span>Average performance</span>
              <strong>{Number(overview?.class_average_percentage ?? 0).toFixed(1)}%</strong>
            </div>
            <div className="progress-shell" style={{ marginTop: 10 }}>
              <div className="progress-fill" style={{ width: `${Math.min(100, Number(overview?.class_average_percentage ?? 0))}%` }} />
            </div>
            <p className="stat-hint" style={{ marginTop: 8 }}>Completed assessments: {overview?.total_assessments_completed ?? 0}</p>
          </div>
        </div>
        <div className="card">
          <h3>At-risk learners</h3>
          {overview?.at_risk_students?.length ? (
            <ul className="stack-list">
              {overview.at_risk_students.map((student) => <li key={student}>Student {student}</li>)}
            </ul>
          ) : <EmptyState title="No at-risk learners" description="The current cohort looks stable." />}
        </div>
      </div>

      <div className="content-grid two-col">
        <div className="card">
          <h3>Weak topics summary</h3>
          {overview?.weak_topics_summary?.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Topic</th><th>Weak</th><th>Moderate</th><th>Strong</th></tr></thead>
                <tbody>
                  {overview.weak_topics_summary.map((topic, index) => (
                    <tr key={index}>
                      <td>Topic {topic.topic_id}</td>
                      <td><span className="badge badge-danger">{topic.weak_count}</span></td>
                      <td><span className="badge badge-warning">{topic.moderate_count}</span></td>
                      <td><span className="badge badge-success">{topic.strong_count}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No topic summary data yet." description="Topic performance summaries will appear after learner submissions." />}
        </div>
        <div className="card">
          <h3>Recent assessments</h3>
          {overview?.recent_assessments?.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Session</th><th>Student</th><th>Quiz</th><th>Score</th><th>Completed</th></tr></thead>
                <tbody>
                  {overview.recent_assessments.map((item) => (
                    <tr key={item.session_id}>
                      <td>{item.session_id}</td>
                      <td>{item.student_id}</td>
                      <td>{item.quiz_id}</td>
                      <td><span className={`badge ${Number(item.percentage || 0) >= 70 ? 'badge-success' : Number(item.percentage || 0) >= 55 ? 'badge-warning' : 'badge-danger'}`}>{Number(item.percentage || 0).toFixed(1)}%</span></td>
                      <td>{item.completed_at ? new Date(item.completed_at).toLocaleString() : 'Not available'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No recent assessments" description="Completed assessment sessions will appear here." />}
        </div>
      </div>
    </div>
  )
}
