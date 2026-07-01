import { useEffect, useState } from 'react'
import api from '../services/api'

export default function TopicManagement() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/topics')
        setTopics(response.data)
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
      <div className="page-header">
        <div>
          <p className="eyebrow">Learning structure</p>
          <h1>Topic management</h1>
        </div>
      </div>
      <div className="card">
        {loading ? <p>Loading topics…</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Domain</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.id}>
                  <td>{topic.topic_name}</td>
                  <td>{topic.domain_id}</td>
                  <td>{topic.learning_outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
