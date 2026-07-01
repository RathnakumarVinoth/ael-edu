import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import Badge from '../components/Badge'
import DashboardCard from '../components/DashboardCard'
import DataTable from '../components/DataTable'
import FormCard from '../components/FormCard'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import api from '../services/api'
import { displayValue, normalizeList } from '../utils/formatters'

const initialForm = {
  domain_id: '',
  topic_name: '',
  description: '',
  learning_outcome: '',
}

export default function TopicManagement() {
  const [topics, setTopics] = useState([])
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')

  const loadTopics = async () => {
    const response = await api.get('/topics')
    setTopics(normalizeList(response.data))
  }

  useEffect(() => {
    const load = async () => {
      const [topicsResponse, domainsResponse] = await Promise.allSettled([
        api.get('/topics'),
        api.get('/domains'),
      ])
      if (topicsResponse.status === 'fulfilled') setTopics(normalizeList(topicsResponse.value.data))
      if (domainsResponse.status === 'fulfilled') setDomains(normalizeList(domainsResponse.value.data))
      if (topicsResponse.status === 'rejected') {
        setMessageType('error')
        setMessage('Unable to load topics right now.')
      }
      setLoading(false)
    }

    load()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    try {
      await api.post('/topics', {
        domain_id: Number(form.domain_id),
        topic_name: form.topic_name,
        description: form.description,
        learning_outcome: form.learning_outcome,
      })
      setMessageType('success')
      setMessage('Topic added successfully.')
      setForm(initialForm)
      await loadTopics()
    } catch {
      setMessageType('error')
      setMessage('Unable to add topic right now.')
    }
  }

  const domainName = (domainId) => domains.find((domain) => Number(domain.id) === Number(domainId))?.domain_name || `Domain ${domainId}`

  return (
    <div className="page">
      <PageHeader
        eyebrow="Learning structure"
        title="Topic Management"
        subtitle="Define topic-level learning outcomes used by mastery analysis and adaptive recommendations."
      />

      {message && <div className={`card ${messageType === 'success' ? 'success-card' : 'error-card'}`}>{message}</div>}

      <div className="content-grid two-col">
        <FormCard title="Add Topic" eyebrow="Topic details">
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Domain
              <select name="domain_id" value={form.domain_id} onChange={handleChange} required>
                <option value="">Select domain</option>
                {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.domain_name || `Domain ${domain.id}`}</option>)}
              </select>
            </label>
            <label>Topic name<input name="topic_name" value={form.topic_name} onChange={handleChange} required /></label>
            <label>Description<textarea name="description" value={form.description} onChange={handleChange} rows="3" /></label>
            <label>Learning outcome<textarea name="learning_outcome" value={form.learning_outcome} onChange={handleChange} rows="3" /></label>
            <button className="btn-primary" type="submit"><Plus size={18} /> Save topic</button>
          </form>
        </FormCard>

        <DashboardCard title="Topic Catalogue" action={<Badge variant="primary">{topics.length} topics</Badge>}>
          {loading ? <LoadingSpinner label="Loading topics..." /> : (
            <DataTable
              data={topics}
              emptyTitle="No topics yet"
              emptyDescription="Add a topic to support mastery analysis and recommendation generation."
              columns={[
                { key: 'topic_name', header: 'Topic', render: (topic) => <strong>{topic.topic_name}</strong> },
                { key: 'domain_id', header: 'Domain', render: (topic) => <Badge variant="neutral">{domainName(topic.domain_id)}</Badge> },
                { key: 'description', header: 'Description', render: (topic) => displayValue(topic.description) },
                { key: 'learning_outcome', header: 'Learning Outcome', render: (topic) => displayValue(topic.learning_outcome) },
              ]}
            />
          )}
        </DashboardCard>
      </div>
    </div>
  )
}
