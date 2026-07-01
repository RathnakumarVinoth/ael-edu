import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Clock, HelpCircle, PlayCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/Badge'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import api from '../services/api'
import { difficultyVariant, normalizeList } from '../utils/formatters'

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
  const [timeTaken, setTimeTaken] = useState('30')
  const [hintsUsed, setHintsUsed] = useState('0')
  const [attempts, setAttempts] = useState('1')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/quizzes')
        setQuizzes(normalizeList(response.data))
      } catch {
        setMessage('Unable to load quizzes right now.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const currentQuestion = activeQuiz?.questions?.[currentIndex]
  const progressValue = activeQuiz?.questions?.length ? ((currentIndex + 1) / activeQuiz.questions.length) * 100 : 0

  const selectedCount = useMemo(() => Object.keys(answers).length, [answers])

  const startQuiz = async (quiz) => {
    try {
      const response = await api.post(`/assessments/start/${quiz.id}`)
      setActiveQuiz({ ...response.data, quiz_name: quiz.quiz_name, duration: quiz.duration, pass_mark: quiz.pass_mark, adaptive_mode: quiz.adaptive_mode })
      setSessionId(response.data.session_id)
      setAnswers({})
      setCurrentIndex(0)
      setMessage('Quiz started. Answer each question and submit at the end.')
      setCalculationError('')
    } catch {
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
        time_taken: Number(timeTaken) || 30,
        hints_used: Number(hintsUsed) || 0,
        attempts: Number(attempts) || 1,
        emotion_state: 'neutral',
        attention_score: 85,
      })
    } catch {
      setCalculationError('This answer could not be saved. Please try selecting it again.')
    }
  }

  const completeQuiz = async () => {
    if (!sessionId) return

    setIsCalculating(true)
    setCalculationError('')
    setCalculationProgress('Updating adaptive learning profile...')
    setMessage('')

    try {
      await api.post(`/assessments/complete/${sessionId}`)
      setCalculationProgress('Calculating ALWE score...')
      await api.post(`/alwe/calculate/${sessionId}`)
      setCalculationProgress('Updating topic mastery...')
      await api.post(`/topic-mastery/calculate/${sessionId}`)

      setCalculationProgress('Opening your results...')
      setActiveQuiz(null)
      setSessionId(null)
      navigate('/student', { replace: true })
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Could not complete quiz.'
      setCalculationError(typeof detail === 'string' ? detail : 'Could not complete quiz.')
    } finally {
      setIsCalculating(false)
      setCalculationProgress('')
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Interactive assessment"
        title="Quiz Attempt Workspace"
        subtitle="Complete adaptive assessments with a focused, research-friendly experience."
      />

      {message && <div className="card info-card">{message}</div>}
      {calculationError && <div className="card error-card">{calculationError}</div>}
      {isCalculating && (
        <div className="card info-card">
          <strong>Updating adaptive learning profile...</strong>
          <p>{calculationProgress || 'Please wait while your results are analyzed.'}</p>
        </div>
      )}

      <div className="content-grid two-col">
        <DashboardCard title="Available Quizzes" action={<Badge variant="primary">{quizzes.length} available</Badge>}>
          {loading ? <LoadingSpinner label="Loading quizzes..." /> : quizzes.length > 0 ? (
            <div className="card-grid">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="mini-card">
                  <div className="row-between">
                    <strong>{quiz.quiz_name}</strong>
                    <Badge variant={quiz.adaptive_mode ? 'success' : 'neutral'}>{quiz.adaptive_mode ? 'Adaptive' : 'Standard'}</Badge>
                  </div>
                  <p className="page-subtitle">Duration: {quiz.duration || 'Not available'} min</p>
                  <p className="stat-hint">Pass mark: {quiz.pass_mark ?? 'Not available'}%</p>
                  <button className="btn-primary" type="button" onClick={() => startQuiz(quiz)} style={{ marginTop: 12 }}>
                    <PlayCircle size={18} /> Start Quiz
                  </button>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No quizzes available" description="Lecturers can make quizzes available from the management workspace." />}
        </DashboardCard>

        <DashboardCard title={activeQuiz ? activeQuiz.quiz_name || 'Active Quiz' : 'Active Quiz'} action={<Badge variant="info">Prototype emotion signal: neutral</Badge>}>
          {!activeQuiz ? <EmptyState title="Select a quiz to begin" description="Choose an assessment from the list to start your attempt." /> : (
            <>
              <div className="mini-card">
                <div className="row-between">
                  <div>
                    <p className="eyebrow">Question {currentIndex + 1} of {activeQuiz.questions.length}</p>
                    <strong>{selectedCount} answered</strong>
                  </div>
                  <Badge variant="neutral">Session {sessionId}</Badge>
                </div>
                <ProgressBar value={progressValue} label="Attempt progress" />
              </div>

              {currentQuestion ? (
                <div className="mini-card" style={{ marginTop: 12 }}>
                  <div className="row-between">
                    <Badge variant={difficultyVariant(currentQuestion.difficulty_level)}>{currentQuestion.difficulty_level}</Badge>
                    <div className="row-between" style={{ justifyContent: 'flex-start' }}>
                      <Badge variant="neutral">{currentQuestion.marks ?? 0} marks</Badge>
                      <Badge variant="neutral"><Clock size={14} /> {currentQuestion.expected_time ?? 'N/A'} sec</Badge>
                    </div>
                  </div>
                  <p className="question-text">{currentQuestion.question_text}</p>
                  <div className="options-grid">
                    {['option_a', 'option_b', 'option_c', 'option_d'].map((key, optionIndex) => {
                      const option = currentQuestion[key]
                      if (!option) return null
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`option-btn ${answers[currentQuestion.question_id] === option ? 'active' : ''}`}
                          onClick={() => handleAnswer(currentQuestion.question_id, option)}
                        >
                          <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}
                        </button>
                      )
                    })}
                  </div>

                  {currentQuestion.hints?.length > 0 && (
                    <div className="mini-card" style={{ marginTop: 12 }}>
                      <div className="row-between">
                        <strong><HelpCircle size={16} /> Hints</strong>
                        <Badge variant="info">{currentQuestion.hints.length}</Badge>
                      </div>
                      <ul className="stack-list" style={{ marginTop: 10 }}>
                        {currentQuestion.hints.map((hint) => <li key={hint.id}>{hint.hint_text}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="inline-fields" style={{ marginTop: 12 }}>
                    <label>Time taken (sec)<input type="number" min="0" value={timeTaken} onChange={(event) => setTimeTaken(event.target.value)} /></label>
                    <label>Hints used<input type="number" min="0" value={hintsUsed} onChange={(event) => setHintsUsed(event.target.value)} /></label>
                  </div>
                  <label className="stack-form" style={{ marginTop: 12 }}>Attempts<input type="number" min="1" value={attempts} onChange={(event) => setAttempts(event.target.value)} /></label>

                  <div className="row-between quiz-actions">
                    <button type="button" className="btn-secondary" onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} disabled={currentIndex === 0}>
                      <ArrowLeft size={17} /> Previous
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setCurrentIndex((value) => Math.min(activeQuiz.questions.length - 1, value + 1))} disabled={currentIndex === activeQuiz.questions.length - 1}>
                      Next <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              ) : <EmptyState title="No questions assigned" description="This quiz does not have generated questions yet." />}

              <button type="button" className="btn-primary" onClick={completeQuiz} disabled={isCalculating || !activeQuiz.questions?.length} style={{ marginTop: 14 }}>
                {isCalculating ? 'Processing...' : 'Complete Quiz'}
              </button>
            </>
          )}
        </DashboardCard>
      </div>
    </div>
  )
}
