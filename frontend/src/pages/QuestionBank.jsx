import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import Badge from '../components/Badge'
import DashboardCard from '../components/DashboardCard'
import DataTable from '../components/DataTable'
import FormCard from '../components/FormCard'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import api from '../services/api'
import { difficultyVariant, displayValue, normalizeList } from '../utils/formatters'

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
  const [messageType, setMessageType] = useState('info')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')

  const topicMap = useMemo(() => {
    const map = new Map()
    topics.forEach((topic) => map.set(Number(topic.id), topic.topic_name))
    return map
  }, [topics])

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesText = question.question_text?.toLowerCase().includes(search.toLowerCase())
      const matchesDifficulty = difficulty === 'all' || question.difficulty_level === difficulty
      const matchesTopic = topicFilter === 'all' || Number(question.topic_id) === Number(topicFilter)
      return matchesText && matchesDifficulty && matchesTopic
    })
  }, [questions, search, difficulty, topicFilter])

  useEffect(() => {
    const load = async () => {
      const [questionsResponse, topicsResponse] = await Promise.allSettled([
        api.get('/questions'),
        api.get('/topics'),
      ])
      if (questionsResponse.status === 'fulfilled') setQuestions(normalizeList(questionsResponse.value.data))
      if (topicsResponse.status === 'fulfilled') setTopics(normalizeList(topicsResponse.value.data))
      setLoading(false)
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
    setMessage('')
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
      setMessageType('success')
      setMessage('Question added successfully.')
      const response = await api.get('/questions')
      setQuestions(normalizeList(response.data))
      setForm(initialForm)
    } catch {
      setMessageType('error')
      setMessage('Unable to add question right now.')
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Assessment authoring"
        title="Question Bank"
        subtitle="Manage adaptive assessment content with a polished authoring workspace."
      />

      {message && <div className={`card ${messageType === 'success' ? 'success-card' : 'error-card'}`}>{message}</div>}

      <div className="content-grid two-col">
        <FormCard title="Add Question" eyebrow="Structured item authoring">
          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Basic Details</h4>
              <div className="inline-fields">
                <label>
                  Topic
                  <select name="topic_id" value={form.topic_id} onChange={handleChange} required>
                    <option value="">Select topic</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>{topic.topic_name}</option>
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
              </div>
              <div className="inline-fields">
                <label>Marks<input name="marks" type="number" min="0" value={form.marks} onChange={handleChange} /></label>
                <label>Expected time (sec)<input name="expected_time" type="number" min="0" value={form.expected_time} onChange={handleChange} /></label>
              </div>
            </div>

            <div className="form-section">
              <h4>Question Text</h4>
              <label>
                Question
                <textarea name="question_text" value={form.question_text} onChange={handleChange} rows="4" required />
              </label>
            </div>

            <div className="form-section">
              <h4>Answer Options</h4>
              <div className="inline-fields">
                <label>Option A<input name="option_a" value={form.option_a} onChange={handleChange} /></label>
                <label>Option B<input name="option_b" value={form.option_b} onChange={handleChange} /></label>
              </div>
              <div className="inline-fields">
                <label>Option C<input name="option_c" value={form.option_c} onChange={handleChange} /></label>
                <label>Option D<input name="option_d" value={form.option_d} onChange={handleChange} /></label>
              </div>
              <label>Correct answer<input name="correct_answer" value={form.correct_answer} onChange={handleChange} placeholder="A / B / C / D or exact option text" /></label>
            </div>

            <div className="form-section">
              <h4>Hints</h4>
              {form.hints.map((hint, index) => (
                <label key={hint.hint_level}>
                  Hint {hint.hint_level}
                  <input value={hint.hint_text} onChange={(event) => handleHintChange(index, event.target.value)} />
                </label>
              ))}
            </div>

            <div className="form-section">
              <h4>Solution</h4>
              <label>
                Solution
                <textarea name="solution" value={form.solution} onChange={handleChange} rows="3" />
              </label>
            </div>

            <button className="btn-primary" type="submit"><Plus size={18} /> Save question</button>
          </form>
        </FormCard>

        <DashboardCard title="Question Library" action={<Badge variant="primary">{filteredQuestions.length} shown</Badge>}>
          <div className="filter-row">
            <label>
              <span className="muted">Search</span>
              <div style={{ position: 'relative' }}>
                <Search size={17} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} />
                <input className="filter-input" style={{ paddingLeft: 38 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search question text" />
              </div>
            </label>
            <label>
              <span className="muted">Difficulty</span>
              <select className="filter-input" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                <option value="all">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>
            <label>
              <span className="muted">Topic</span>
              <select className="filter-input" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
                <option value="all">All</option>
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.topic_name}</option>)}
              </select>
            </label>
          </div>

          {loading ? <LoadingSpinner label="Loading questions..." /> : (
            <DataTable
              data={filteredQuestions}
              emptyTitle="No questions found"
              emptyDescription="Try a different search or add a new question."
              columns={[
                { key: 'question_text', header: 'Question', render: (question) => displayValue(question.question_text) },
                { key: 'topic_id', header: 'Topic', render: (question) => topicMap.get(Number(question.topic_id)) || `Topic ${question.topic_id}` },
                { key: 'difficulty_level', header: 'Difficulty', render: (question) => <Badge variant={difficultyVariant(question.difficulty_level)}>{question.difficulty_level}</Badge> },
                { key: 'marks', header: 'Marks', render: (question) => displayValue(question.marks) },
                { key: 'expected_time', header: 'Expected Time', render: (question) => `${displayValue(question.expected_time)} sec` },
                { key: 'correct_answer', header: 'Correct Answer', render: (question) => displayValue(question.correct_answer) },
              ]}
            />
          )}
        </DashboardCard>
      </div>
    </div>
  )
}
