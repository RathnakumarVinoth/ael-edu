import { useEffect, useMemo, useState } from 'react'
import { Eye, Plus, Sparkles, Trash2 } from 'lucide-react'
import Badge from '../components/Badge'
import DashboardCard from '../components/DashboardCard'
import DataTable from '../components/DataTable'
import FormCard from '../components/FormCard'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import api from '../services/api'
import { difficultyVariant, displayValue, normalizeList } from '../utils/formatters'

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
  const [questions, setQuestions] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initialQuizForm)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [generateForm, setGenerateForm] = useState({ easy_count: '0', medium_count: '0', hard_count: '0', advanced_count: '0' })

  const questionMap = useMemo(() => {
    const map = new Map()
    questions.forEach((question) => map.set(Number(question.id), question))
    return map
  }, [questions])

  useEffect(() => {
    const load = async () => {
      const [quizResponse, questionResponse] = await Promise.allSettled([
        api.get('/quizzes'),
        api.get('/questions'),
      ])
      if (quizResponse.status === 'fulfilled') setQuizzes(normalizeList(quizResponse.value.data))
      if (questionResponse.status === 'fulfilled') setQuestions(normalizeList(questionResponse.value.data))
      setLoading(false)
    }

    load()
  }, [])

  const refreshQuizzes = async () => {
    const response = await api.get('/quizzes')
    setQuizzes(normalizeList(response.data))
  }

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
    setMessage('')
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
      setMessageType('success')
      setMessage('Quiz created successfully.')
      await refreshQuizzes()
      setForm(initialQuizForm)
    } catch {
      setMessageType('error')
      setMessage('Unable to create quiz right now.')
    }
  }

  const handleSelectQuiz = async (quiz) => {
    setSelectedQuiz(quiz)
    try {
      const response = await api.get(`/quizzes/${quiz.id}/questions`)
      setQuizQuestions(normalizeList(response.data))
    } catch {
      setQuizQuestions([])
    }
  }

  const handleGenerateQuestions = async (event) => {
    event.preventDefault()
    if (!selectedQuiz) return
    setMessage('')
    try {
      await api.post(`/quizzes/${selectedQuiz.id}/generate`, {
        easy_count: Number(generateForm.easy_count),
        medium_count: Number(generateForm.medium_count),
        hard_count: Number(generateForm.hard_count),
        advanced_count: Number(generateForm.advanced_count),
      })
      const response = await api.get(`/quizzes/${selectedQuiz.id}/questions`)
      setQuizQuestions(normalizeList(response.data))
      setMessageType('success')
      setMessage('Quiz questions generated successfully.')
    } catch (error) {
      const detail = error?.response?.data?.detail
      setMessageType('error')
      setMessage(typeof detail === 'string' ? detail : 'Unable to generate quiz questions right now.')
    }
  }

  const handleDeleteQuiz = async (quiz) => {
    try {
      await api.delete(`/quizzes/${quiz.id}`)
      if (selectedQuiz?.id === quiz.id) {
        setSelectedQuiz(null)
        setQuizQuestions([])
      }
      await refreshQuizzes()
      setMessageType('success')
      setMessage('Quiz deleted successfully.')
    } catch {
      setMessageType('error')
      setMessage('Unable to delete quiz right now.')
    }
  }

  const generatedRows = quizQuestions.map((item) => ({
    ...item,
    question: questionMap.get(Number(item.question_id)),
  }))

  return (
    <div className="page">
      <PageHeader
        eyebrow="Assessment orchestration"
        title="Quiz Management"
        subtitle="Create adaptive quizzes and generate question sets for research-led assessment workflows."
      />

      {message && <div className={`card ${messageType === 'success' ? 'success-card' : 'error-card'}`}>{message}</div>}

      <div className="content-grid two-col">
        <FormCard title="Create Quiz" eyebrow="Quiz setup">
          <form className="stack-form" onSubmit={handleCreateQuiz}>
            <label>Quiz name<input name="quiz_name" value={form.quiz_name} onChange={handleChange} required /></label>
            <div className="inline-fields">
              <label>Course ID<input name="course_id" type="number" value={form.course_id} onChange={handleChange} /></label>
              <label>Subject ID<input name="subject_id" type="number" value={form.subject_id} onChange={handleChange} /></label>
            </div>
            <div className="inline-fields">
              <label>Duration (min)<input name="duration" type="number" min="0" value={form.duration} onChange={handleChange} /></label>
              <label>Pass mark<input name="pass_mark" type="number" min="0" max="100" value={form.pass_mark} onChange={handleChange} /></label>
            </div>
            <div className="checkbox-row">
              <label><input type="checkbox" name="adaptive_mode" checked={form.adaptive_mode} onChange={handleChange} /> Adaptive mode</label>
              <label><input type="checkbox" name="randomization_mode" checked={form.randomization_mode} onChange={handleChange} /> Randomization mode</label>
              <label><input type="checkbox" name="hint_mode" checked={form.hint_mode} onChange={handleChange} /> Hint mode</label>
            </div>
            <button className="btn-primary" type="submit"><Plus size={18} /> Create quiz</button>
          </form>
        </FormCard>

        <DashboardCard title="Quiz List" action={<Badge variant="primary">{quizzes.length} quizzes</Badge>}>
          {loading ? <LoadingSpinner label="Loading quizzes..." /> : (
            <DataTable
              data={quizzes}
              emptyTitle="No quizzes yet"
              emptyDescription="Create your first quiz to start building adaptive assessments."
              columns={[
                { key: 'quiz_name', header: 'Quiz', render: (quiz) => <strong>{quiz.quiz_name}</strong> },
                { key: 'duration', header: 'Duration', render: (quiz) => `${displayValue(quiz.duration)} min` },
                { key: 'pass_mark', header: 'Pass Mark', render: (quiz) => `${displayValue(quiz.pass_mark)}%` },
                { key: 'adaptive_mode', header: 'Adaptive', render: (quiz) => <Badge variant={quiz.adaptive_mode ? 'success' : 'neutral'}>{quiz.adaptive_mode ? 'On' : 'Off'}</Badge> },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (quiz) => (
                    <div className="row-between" style={{ justifyContent: 'flex-start' }}>
                      <button className="btn-secondary" type="button" onClick={() => handleSelectQuiz(quiz)}><Eye size={16} /> View</button>
                      <button className="btn-secondary" type="button" onClick={() => handleDeleteQuiz(quiz)}><Trash2 size={16} /> Delete</button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </DashboardCard>
      </div>

      <div className="content-grid two-col">
        <DashboardCard
          title="Generate Questions"
          action={selectedQuiz ? <Badge variant="info">{selectedQuiz.quiz_name}</Badge> : <Badge variant="neutral">Select a quiz</Badge>}
        >
          <form className="stack-form" onSubmit={handleGenerateQuestions}>
            <div className="card-grid">
              {[
                ['easy_count', 'Easy', 'success'],
                ['medium_count', 'Medium', 'primary'],
                ['hard_count', 'Hard', 'orange'],
                ['advanced_count', 'Advanced', 'purple'],
              ].map(([name, label, variant]) => (
                <label key={name} className="mini-card">
                  <Badge variant={variant}>{label}</Badge>
                  <input name={name} type="number" min="0" value={generateForm[name]} onChange={handleGenerateChange} />
                </label>
              ))}
            </div>
            <button className="btn-primary" type="submit" disabled={!selectedQuiz}><Sparkles size={18} /> Generate Questions</button>
          </form>
        </DashboardCard>

        <DashboardCard title="Generated Questions View">
          <DataTable
            data={generatedRows}
            emptyTitle="No questions assigned yet"
            emptyDescription="Select a quiz and generate questions to populate this panel."
            rowKey={(item) => item.id}
            columns={[
              { key: 'question_id', header: 'Question ID', render: (item) => item.question_id },
              { key: 'question_text', header: 'Question', render: (item) => item.question?.question_text || 'Question details unavailable' },
              { key: 'difficulty', header: 'Difficulty', render: (item) => <Badge variant={difficultyVariant(item.question?.difficulty_level)}>{item.question?.difficulty_level || 'Unknown'}</Badge> },
              { key: 'marks', header: 'Marks', render: (item) => displayValue(item.question?.marks) },
              { key: 'expected_time', header: 'Expected Time', render: (item) => item.question?.expected_time ? `${item.question.expected_time} sec` : 'Not available' },
            ]}
          />
        </DashboardCard>
      </div>
    </div>
  )
}
