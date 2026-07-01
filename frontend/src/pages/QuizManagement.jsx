import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import api from '../services/api'

const initialQuizForm = {
  quiz_name: '',
  course_id: '',
  subject_id: '',
  duration: '30',
  pass_mark: '60',
  adaptive_mode: false,
  randomization_mode: false,
  hint_mode: false,
}

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initialQuizForm)
  const [message, setMessage] = useState('')
  const [generateForm, setGenerateForm] = useState({ easy_count: '0', medium_count: '0', hard_count: '0', advanced_count: '0' })

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/quizzes')
        setQuizzes(response.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleGenerateChange = (event) => {
    const { name, value } = event.target
    setGenerateForm((current) => ({ ...current, [name]: value }))
  }

  const handleCreateQuiz = async (event) => {
    event.preventDefault()
    try {
      await api.post('/quizzes', {
        ...form,
        course_id: Number(form.course_id) || null,
        subject_id: Number(form.subject_id) || null,
        duration: Number(form.duration),
        pass_mark: Number(form.pass_mark),
        adaptive_mode: Boolean(form.adaptive_mode),
        randomization_mode: Boolean(form.randomization_mode),
        hint_mode: Boolean(form.hint_mode),
      })
      setMessage('Quiz created successfully.')
      const response = await api.get('/quizzes')
      setQuizzes(response.data)
      setForm(initialQuizForm)
    } catch (error) {
      setMessage('Unable to create quiz right now.')
    }
  }

  const handleSelectQuiz = async (quiz) => {
    setSelectedQuiz(quiz)
    try {
      const response = await api.get(`/quizzes/${quiz.id}/questions`)
      setQuizQuestions(response.data)
    } catch (error) {
      console.error(error)
      setQuizQuestions([])
    }
  }

  const handleGenerateQuestions = async (event) => {
    event.preventDefault()
    if (!selectedQuiz) return
    try {
      await api.post(`/quizzes/${selectedQuiz.id}/generate`, {
        easy_count: Number(generateForm.easy_count),
        medium_count: Number(generateForm.medium_count),
        hard_count: Number(generateForm.hard_count),
        advanced_count: Number(generateForm.advanced_count),
      })
      const response = await api.get(`/quizzes/${selectedQuiz.id}/questions`)
      setQuizQuestions(response.data)
      setMessage('Quiz questions generated successfully.')
    } catch (error) {
      setMessage('Unable to generate quiz questions right now.')
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Assessment orchestration" title="Quiz Management" subtitle="Create adaptive quizzes and generate question sets for research-led assessment workflows." />

      {message && <div className="card info-card">{message}</div>}

      <div className="content-grid two-col">
        <div className="card">
          <h3>Create quiz</h3>
          <form className="stack-form" onSubmit={handleCreateQuiz}>
            <label>Quiz name<input name="quiz_name" value={form.quiz_name} onChange={handleChange} required /></label>
            <div className="inline-fields">
              <label>Course ID<input name="course_id" type="number" value={form.course_id} onChange={handleChange} /></label>
              <label>Subject ID<input name="subject_id" type="number" value={form.subject_id} onChange={handleChange} /></label>
            </div>
            <div className="inline-fields">
              <label>Duration (min)<input name="duration" type="number" value={form.duration} onChange={handleChange} /></label>
              <label>Pass mark<input name="pass_mark" type="number" value={form.pass_mark} onChange={handleChange} /></label>
            </div>
            <div className="checkbox-row">
              <label><input type="checkbox" name="adaptive_mode" checked={form.adaptive_mode} onChange={handleChange} /> Adaptive mode</label>
              <label><input type="checkbox" name="randomization_mode" checked={form.randomization_mode} onChange={handleChange} /> Randomization</label>
              <label><input type="checkbox" name="hint_mode" checked={form.hint_mode} onChange={handleChange} /> Hint mode</label>
            </div>
            <button className="btn-primary" type="submit">Create quiz</button>
          </form>
        </div>

        <div className="card">
          <h3>Existing quizzes</h3>
          {loading ? <LoadingSpinner label="Loading quizzes…" /> : quizzes.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Pass mark</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id}>
                      <td>{quiz.quiz_name}</td>
                      <td>{quiz.pass_mark}%</td>
                      <td><button className="btn-secondary" type="button" onClick={() => handleSelectQuiz(quiz)}>Inspect</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No quizzes yet" description="Create your first quiz to start building adaptive assessments." />}
        </div>
      </div>

      {selectedQuiz && (
        <div className="card">
          <h3>Generate questions for {selectedQuiz.quiz_name}</h3>
          <form className="stack-form" onSubmit={handleGenerateQuestions}>
            <div className="inline-fields">
              <label>Easy<input name="easy_count" type="number" value={generateForm.easy_count} onChange={handleGenerateChange} /></label>
              <label>Medium<input name="medium_count" type="number" value={generateForm.medium_count} onChange={handleGenerateChange} /></label>
            </div>
            <div className="inline-fields">
              <label>Hard<input name="hard_count" type="number" value={generateForm.hard_count} onChange={handleGenerateChange} /></label>
              <label>Advanced<input name="advanced_count" type="number" value={generateForm.advanced_count} onChange={handleGenerateChange} /></label>
            </div>
            <button className="btn-primary" type="submit">Generate quiz questions</button>
          </form>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Quiz question ID</th>
                  <th>Question ID</th>
                </tr>
              </thead>
              <tbody>
                {quizQuestions.length > 0 ? quizQuestions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.question_id}</td>
                  </tr>
                )) : <tr><td colSpan="2">No questions assigned yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
