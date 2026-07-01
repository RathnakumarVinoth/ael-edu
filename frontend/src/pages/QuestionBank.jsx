import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import api from '../services/api'

const initialForm = {
  topic_id: '',
  difficulty_level: 'Easy',
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: '',
  marks: '5',
  expected_time: '30',
  solution: '',
  hints: [{ hint_level: 1, hint_text: '' }, { hint_level: 2, hint_text: '' }, { hint_level: 3, hint_text: '' }],
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')

  const topicOptions = useMemo(() => topics.map((topic) => ({ value: topic.id, label: topic.topic_name })), [topics])

  useEffect(() => {
    const load = async () => {
      try {
        const [questionsResponse, topicsResponse] = await Promise.all([
          api.get('/questions'),
          api.get('/topics'),
        ])
        setQuestions(questionsResponse.data)
        setTopics(topicsResponse.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleHintChange = (index, value) => {
    setForm((current) => {
      const hints = [...current.hints]
      hints[index] = { ...hints[index], hint_text: value }
      return { ...current, hints }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await api.post('/questions', {
        topic_id: Number(form.topic_id),
        difficulty_level: form.difficulty_level,
        question_text: form.question_text,
        option_a: form.option_a,
        option_b: form.option_b,
        option_c: form.option_c,
        option_d: form.option_d,
        correct_answer: form.correct_answer,
        marks: Number(form.marks),
        expected_time: Number(form.expected_time),
        solution: form.solution,
        hints: form.hints.filter((hint) => hint.hint_text.trim()),
      })
      setMessage('Question added successfully.')
      const response = await api.get('/questions')
      setQuestions(response.data)
      setForm(initialForm)
    } catch (error) {
      setMessage('Unable to add question right now.')
    }
  }

  return (
    <div className="page">
      <PageHeader eyeliner="Assessment authoring" title="Question Bank" subtitle="Manage adaptive assessment content with a polished authoring workspace." />

      {message && <div className="card info-card">{message}</div>}

      <div className="content-grid two-col">
        <div className="card">
          <h3>Add new question</h3>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Topic
              <select name="topic_id" value={form.topic_id} onChange={handleChange} required>
                <option value="">Select topic</option>
                {topicOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Difficulty level
              <select name="difficulty_level" value={form.difficulty_level} onChange={handleChange}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>
            <label>
              Question text
              <textarea name="question_text" value={form.question_text} onChange={handleChange} rows="3" required />
            </label>
            <div className="inline-fields">
              <label>Option A<input name="option_a" value={form.option_a} onChange={handleChange} /></label>
              <label>Option B<input name="option_b" value={form.option_b} onChange={handleChange} /></label>
            </div>
            <div className="inline-fields">
              <label>Option C<input name="option_c" value={form.option_c} onChange={handleChange} /></label>
              <label>Option D<input name="option_d" value={form.option_d} onChange={handleChange} /></label>
            </div>
            <label>Correct answer<input name="correct_answer" value={form.correct_answer} onChange={handleChange} placeholder="A / B / C / D" /></label>
            <div className="inline-fields">
              <label>Marks<input name="marks" type="number" value={form.marks} onChange={handleChange} /></label>
              <label>Expected time (sec)<input name="expected_time" type="number" value={form.expected_time} onChange={handleChange} /></label>
            </div>
            <label>
              Solution
              <textarea name="solution" value={form.solution} onChange={handleChange} rows="2" />
            </label>
            <div>
              <p className="muted">Hints</p>
              {form.hints.map((hint, index) => (
                <label key={hint.hint_level}>
                  Hint {hint.hint_level}
                  <input value={hint.hint_text} onChange={(event) => handleHintChange(index, event.target.value)} />
                </label>
              ))}
            </div>
            <button className="btn-primary" type="submit">Save question</button>
          </form>
        </div>

        <div className="card">
          <h3>Question library</h3>
          {loading ? <LoadingSpinner label="Loading questions…" /> : questions.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Difficulty</th>
                    <th>Topic</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id}>
                      <td>{question.question_text}</td>
                      <td><span className={`badge ${question.difficulty_level === 'Advanced' ? 'badge-danger' : question.difficulty_level === 'Hard' ? 'badge-warning' : question.difficulty_level === 'Medium' ? 'badge-primary' : 'badge-success'}`}>{question.difficulty_level}</span></td>
                      <td>{question.topic_id}</td>
                      <td>{question.marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No questions yet" description="Create a new item to start building your assessment bank." />}
        </div>
      </div>
    </div>
  )
}
