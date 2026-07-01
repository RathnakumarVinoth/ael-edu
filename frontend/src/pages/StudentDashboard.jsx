import { useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import api from '../services/api'

const categoryBadge = (category) => {
  if (!category) return <span className="badge badge-info">Not calculated yet</span>
  if (category === 'Advanced Student') return <span className="badge badge-success">Advanced Student</span>
  if (category === 'Good Student') return <span className="badge badge-primary">Good Student</span>
  if (category === 'Average Student') return <span className="badge badge-warning">Average Student</span>
  if (category === 'Weak Student') return <span className="badge badge-warning">Weak Student</span>
  if (category === 'At-Risk Student') return <span className="badge badge-danger">At-Risk Student</span>
  return <span className="badge badge-info">{category}</span>
}

const scoreClass = (percentage) => {
  if (percentage === null || percentage === undefined) return ''
  if (percentage >= 85) return 'badge-success'
  if (percentage >= 70) return 'badge-primary'
  if (percentage >= 55) return 'badge-warning'
  if (percentage >= 40) return 'badge-warning'
  return 'badge-danger'
}

const masteryClass = (status) => {
  if (status === 'strong') return 'badge-success'
  if (status === 'moderate') return 'badge-warning'
  return 'badge-danger'
}

export default function StudentDashboard() {
  const [overview, setOverview] = useState(null)
  const [progress, setProgress] = useState([])
  const [mastery, setMastery] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, progressRes, masteryRes, resultsRes] = await Promise.all([
          api.get('/dashboard/student/overview'),
          api.get('/dashboard/student/progress'),
          api.get('/topic-mastery/my-mastery'),
          api.get('/assessments/my-results'),
        ])
        setOverview(overviewRes.data)
        setProgress(progressRes.data)
        setMastery(masteryRes.data)
        setRecommendations(overviewRes.data?.recommendations || [])
        setResults(resultsRes.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <div className="page"><div className="card"><LoadingSpinner label="Loading your personalized dashboard…" /></div></div>
  }

  const chartData = progress.map((item) => ({
    label: `Session ${item.session_id}`,
    score: item.percentage || 0,
  }))

  const sortedMastery = [...mastery].sort((a, b) => {
    const order = { weak: 0, moderate: 1, strong: 2 }
    return (order[a.status] ?? 99) - (order[b.status] ?? 99)
  })

  const formattedAverage = overview?.average_percentage !== null && overview?.average_percentage !== undefined ? Number(overview.average_percentage).toFixed(1) : '0.0'
  const latestCategory = overview?.latest_category || null

  return (
    <div className="page">
      <PageHeader
        eyebrow="Student learning overview"
        title="Personalized Learning Dashboard"
        subtitle="Your adaptive learning path is updated based on your latest assessment performance."
      />

      <div className="card hero-card">
        <div className="row-between">
          <div>
            <h3>Welcome back, {localStorage.getItem('student_name') || 'Student'}</h3>
            <p className="page-subtitle">Latest assessment insights are surfaced below for your review and revision planning.</p>
          </div>
          {categoryBadge(latestCategory)}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="🧪" label="Assessments completed" value={overview?.total_assessments_completed ?? 0} hint="Across all completed sessions" />
        <StatCard icon="📈" label="Average performance" value={`${formattedAverage}%`} hint="Rounded to one decimal place" />
        <StatCard icon="🧠" label="Latest ALWE score" value={overview?.latest_alwe_score ?? 0} hint="Adaptive learning profile score" />
        <StatCard icon="🏷️" label="Latest category" value={latestCategory || 'Not calculated yet'} hint="Current learning classification" />
      </div>

      <div className="content-grid">
        <div className="card chart-card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3>Performance trend</h3>
            <span className="badge badge-info">Assessment sessions</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#eef2ff" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No assessment history yet." description="Complete a quiz to see your progress trend." />}
        </div>

        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3>Recommended next steps</h3>
            <span className="badge badge-danger">Latest recommendations</span>
          </div>
          {recommendations.length > 0 ? (
            <ul className="stack-list">
              {recommendations.map((item, index) => (
                <li key={`${item}-${index}`} className={`recommendation-card ${item.includes('high:') ? 'high-priority' : item.includes('medium:') ? 'medium-priority' : 'low-priority'}`}>
                  <strong>{item}</strong>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No recommendations available yet." description="Your adaptive study guidance will appear after assessment completion." />}
        </div>
      </div>

      <div className="content-grid two-col">
        <div className="card">
          <h3>Topic mastery</h3>
          {sortedMastery.length > 0 ? (
            <ul className="stack-list">
              {sortedMastery.map((item) => (
                <li key={item.id}>
                  <div className="row-between">
                    <strong>Topic {item.topic_id}</strong>
                    <span className={`badge ${masteryClass(item.status)}`}>{item.status}</span>
                  </div>
                  <div className="progress-shell" style={{ marginTop: 8 }}>
                    <div className={`progress-fill ${item.status === 'weak' ? 'danger' : item.status === 'moderate' ? 'warning' : 'success'}`} style={{ width: `${Math.max(0, Math.min(100, item.mastery_percentage || 0))}%` }} />
                  </div>
                  <div className="row-between" style={{ marginTop: 8 }}>
                    <span className="stat-hint">Mastery</span>
                    <strong>{item.mastery_percentage?.toFixed(1)}%</strong>
                  </div>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No topic mastery calculated yet." description="Topic mastery will appear once an assessment is completed." />}
        </div>

        <div className="card">
          <h3>Recent results</h3>
          {results.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Completed at</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.quiz_id}</td>
                      <td><span className={`badge ${scoreClass(item.percentage)}`}>{item.percentage?.toFixed(1)}%</span></td>
                      <td>{item.completed_at ? 'Completed' : 'In progress'}</td>
                      <td>{item.completed_at ? new Date(item.completed_at).toLocaleString() : 'Not available'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No recent results yet." description="Your latest quiz attempts will appear here." />}
        </div>
      </div>
    </div>
  )
}
