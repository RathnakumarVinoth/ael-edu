import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import api from '../services/api'

export default function AdminDashboard() {
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
    return <div className="page"><div className="card"><LoadingSpinner label="Loading administration view…" /></div></div>
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="System administration"
        title="Admin Operations Dashboard"
        subtitle="A concise platform overview for monitoring learning activities and instructional operations."
      />

      <div className="stats-grid">
        <StatCard icon="👥" label="Students" value={overview?.total_students ?? 0} hint="Registered learners" />
        <StatCard icon="🧩" label="Quizzes" value={overview?.total_quizzes ?? 0} hint="Current quiz inventory" />
        <StatCard icon="🧪" label="Completed assessments" value={overview?.total_assessments_completed ?? 0} hint="Submission count" />
        <StatCard icon="📈" label="Class average" value={`${Number(overview?.class_average_percentage ?? 0).toFixed(1)}%`} hint="Cohort performance" />
      </div>

      <div className="content-grid two-col">
        <div className="card">
          <h3>Platform health snapshot</h3>
          <p className="page-subtitle" style={{ marginTop: 8 }}>Faculty and student activity are surfaced in this research-style control panel for monitoring engagement and intervention planning.</p>
        </div>
        <div className="card">
          <h3>Management shortcuts</h3>
          <ul className="stack-list">
            <li>Course management</li>
            <li>Topic management</li>
            <li>Question bank</li>
            <li>Quiz management</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>Recent cohort performance</h3>
        {overview?.recent_assessments?.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Session</th><th>Student</th><th>Quiz</th><th>Score</th></tr></thead>
              <tbody>{overview.recent_assessments.slice(0, 5).map((item) => <tr key={item.session_id}><td>{item.session_id}</td><td>{item.student_id}</td><td>{item.quiz_id}</td><td><span className={`badge ${Number(item.percentage || 0) >= 70 ? 'badge-success' : Number(item.percentage || 0) >= 55 ? 'badge-warning' : 'badge-danger'}`}>{Number(item.percentage || 0).toFixed(1)}%</span></td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No recent assessment activity" description="Cohort activity will appear after learner submissions." />}
      </div>
    </div>
  )
}
