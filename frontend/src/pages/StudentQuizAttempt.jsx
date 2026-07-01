import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import api from '../services/api'

export default function StudentQuizAttempt() {
  const [quizzes, setQuizzes] = useState([])
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationProgress, setCalculationProgress] = useState('')
  const [calculationError, setCalculationError] = useState('')
  const navigate = useNavigate()

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

  const startQuiz = async (quizId) => {
    try {
      const response = await api.post(`/assessments/start/${quizId}`)
      setActiveQuiz(response.data)
      setSessionId(response.data.session_id)
      setAnswers({})
      setCurrentIndex(0)
      setMessage('Quiz started. Answer each question and submit at the end.')
    } catch (error) {
      setMessage('Unable to start quiz right now.')
    }
  }

  const handleAnswer = async (questionId, value) => {
    if (!sessionId) return
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    try {
      await api.post(`/assessments/${sessionId}/submit-answer`, {
        question_id: questionId,
        answer: value,
        time_taken: 30,
        hints_used: 0,
        attempts: 1,
        emotion_state: 'neutral',
        attention_score: 85,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const completeQuiz = async () => {
    if (!sessionId) return

    setIsCalculating(true)
    setCalculationError('')
    setCalculationProgress('Completing assessment...')
    setMessage('')

    try {
      await api.post(`/assessments/complete/${sessionId}`)
      setCalculationProgress('Calculating ALWE score...')
      await api.post(`/alwe/calculate/${sessionId}`)
      setCalculationProgress('Updating topic mastery...')
      await api.post(`/topic-mastery/calculate/${sessionId}`)

      setCalculationProgress('Finishing up...')
      setMessage('Quiz completed successfully. Your dashboard is being refreshed.')
      setActiveQuiz(null)
      setSessionId(null)
      navigate('/results', { replace: true })
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Could not complete quiz.'
      setCalculationError(typeof detail === 'string' ? detail : 'Could not complete quiz.')
      setMessage('')
    } finally {
      setIsCalculating(false)
      setCalculationProgress('')
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Interactive assessment" title="Quiz Attempt Workspace" subtitle="Complete adaptive assessments with a focused, research-friendly experience." />

      {message && <div className="card info-card">{message}</div>}
      {calculationError && <div className="card error">{calculationError}</div>}
      {isCalculating && (
        <div className="card info-card">
          <strong>Processing quiz results…</strong>
          <p>{calculationProgress || 'Please wait while your results are being analyzed.'}</p>
        </div>
      )}

      <div className="content-grid two-col">
        <div className="card">
          <h3>Available quizzes</h3>
          {loading ? <LoadingSpinner label="Loading quizzes…" /> : quizzes.length > 0 ? (
            <ul className="stack-list">
              {quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <div className="row-between">
                    <strong>{quiz.quiz_name}</strong>
                    <button className="btn-primary" type="button" onClick={() => startQuiz(quiz.id)}>Start</button>
                  </div>
                  <p className="page-subtitle">Pass mark: {quiz.pass_mark}% • Duration: {quiz.duration || '—'} mins</p>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No quizzes available" description="Lecturers can make quizzes available from the admin workspace." />}
        </div>

        <div className="card">
          <h3>Active quiz</h3>
          {!activeQuiz ? <EmptyState title="Select a quiz to begin" description="Choose an assessment from the list to start your attempt." /> : (
            <>
              <div className="row-between" style={{ marginBottom: 12 }}>
                <div>
                  <p className="eyebrow">Live assessment</p>
                  <strong>Question {currentIndex + 1}</strong> of {activeQuiz.questions.length}
                </div>
                <span className="badge badge-info">Prototype emotion signal: neutral</span>
              </div>
              {activeQuiz.questions[currentIndex] && (
                <div>
                  <p className="question-text">{activeQuiz.questions[currentIndex].question_text}</p>
                  <div className="options-grid">
                    {['option_a', 'option_b', 'option_c', 'option_d'].map((key) => {
                      const option = activeQuiz.questions[currentIndex][key]
                      if (!option) return null
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`option-btn ${answers[activeQuiz.questions[currentIndex].question_id] === option ? 'active' : ''}`}
                          onClick={() => handleAnswer(activeQuiz.questions[currentIndex].question_id, option)}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                  <div className="row-between quiz-actions">
                    <button type="button" className="btn-secondary" onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} disabled={currentIndex === 0}>Previous</button>
                    <button type="button" className="btn-secondary" onClick={() => setCurrentIndex((value) => Math.min(activeQuiz.questions.length - 1, value + 1))}>Next</button>
                  </div>
                </div>
              )}
              <button type="button" className="btn-primary" onClick={completeQuiz} disabled={isCalculating}>
                {isCalculating ? 'Processing…' : 'Complete quiz'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
