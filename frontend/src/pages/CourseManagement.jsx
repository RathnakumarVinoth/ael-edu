import { useEffect, useState } from 'react'
import api from '../services/api'

const topicFormInitial = {
  domain_id: '',
  topic_name: '',
  description: '',
  learning_outcome: '',
}

export default function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [domains, setDomains] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [topicForm, setTopicForm] = useState(topicFormInitial)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesResponse, subjectsResponse, domainsResponse, topicsResponse] = await Promise.all([
          api.get('/courses'),
          api.get('/subjects'),
          api.get('/domains'),
          api.get('/topics'),
        ])
        setCourses(coursesResponse.data)
        setSubjects(subjectsResponse.data)
        setDomains(domainsResponse.data)
        setTopics(topicsResponse.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleTopicChange = (event) => {
    const { name, value } = event.target
    setTopicForm((current) => ({ ...current, [name]: value }))
  }

  const handleTopicSubmit = async (event) => {
    event.preventDefault()
    try {
      await api.post('/topics', {
        domain_id: Number(topicForm.domain_id),
        topic_name: topicForm.topic_name,
        description: topicForm.description,
        learning_outcome: topicForm.learning_outcome,
      })
      setMessage('Topic added successfully.')
      const response = await api.get('/topics')
      setTopics(response.data)
      setTopicForm(topicFormInitial)
    } catch (error) {
      setMessage('Unable to add topic right now.')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Curriculum administration</p>
          <h1>Course and topic management</h1>
        </div>
      </div>

      {message && <div className="card info-card">{message}</div>}

      <div className="content-grid two-col">
        <div className="card">
          <h3>Add topic</h3>
          <form className="stack-form" onSubmit={handleTopicSubmit}>
            <label>
              Domain ID
              <input name="domain_id" type="number" value={topicForm.domain_id} onChange={handleTopicChange} required />
            </label>
            <label>
              Topic name
              <input name="topic_name" value={topicForm.topic_name} onChange={handleTopicChange} required />
            </label>
            <label>
              Description
              <textarea name="description" value={topicForm.description} onChange={handleTopicChange} rows="2" />
            </label>
            <label>
              Learning outcome
              <textarea name="learning_outcome" value={topicForm.learning_outcome} onChange={handleTopicChange} rows="2" />
            </label>
            <button className="btn-primary" type="submit">Save topic</button>
          </form>
        </div>

        <div className="card">
          <h3>Curriculum overview</h3>
          {loading ? <p>Loading curriculum…</p> : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Subject</th>
                    <th>Domain</th>
                    <th>Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic) => (
                    <tr key={topic.id}>
                      <td>{courses.find((course) => course.id === (subjects.find((subject) => subject.id === domains.find((domain) => domain.id === topic.domain_id)?.subject_id)?.course_id))?.course_name || '—'}</td>
                      <td>{subjects.find((subject) => subject.id === domains.find((domain) => domain.id === topic.domain_id)?.subject_id)?.subject_name || '—'}</td>
                      <td>{domains.find((domain) => domain.id === topic.domain_id)?.domain_name || '—'}</td>
                      <td>{topic.topic_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="content-grid three-col">
        <div className="card">
          <h3>Courses</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Code</th></tr></thead>
              <tbody>{courses.map((course) => <tr key={course.id}><td>{course.course_name}</td><td>{course.course_code}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Subjects</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Code</th></tr></thead>
              <tbody>{subjects.map((subject) => <tr key={subject.id}><td>{subject.subject_name}</td><td>{subject.subject_code}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Domains</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Description</th></tr></thead>
              <tbody>{domains.map((domain) => <tr key={domain.id}><td>{domain.domain_name}</td><td>{domain.description}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
