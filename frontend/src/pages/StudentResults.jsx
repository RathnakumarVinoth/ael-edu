import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import api from '../services/api'

export default function StudentResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/assessments/my-results')
        setResults(response.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="page">
      <PageHeader eyebrow="Assessment reflection" title="Student Results" subtitle="Review completed assessments, ALWE outcomes, and adaptive recommendations in one place." />
      <div className="card">
        {loading ? <LoadingSpinner label="Loading results…" /> : results.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Completed date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.quiz_id}</td>
                    <td><span className={`badge ${item.percentage >= 85 ? 'badge-success' : item.percentage >= 70 ? 'badge-primary' : item.percentage >= 55 ? 'badge-warning' : 'badge-danger'}`}>{item.percentage?.toFixed(1)}%</span></td>
                    <td>{item.completed_at ? 'Completed' : 'In progress'}</td>
                    <td>{item.completed_at ? new Date(item.completed_at).toLocaleString() : 'Not available'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No results yet" description="Your assessment history will appear here after completing a quiz." />}
      </div>
    </div>
  )
}
