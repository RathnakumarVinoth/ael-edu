import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Brain, ClipboardCheck, Sparkles, Target } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

const features = [
  { icon: ClipboardCheck, label: 'Adaptive assessments' },
  { icon: Brain, label: 'ALWE-based student classification' },
  { icon: BarChart3, label: 'Topic mastery analytics' },
  { icon: Target, label: 'Personalized recommendations' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      const role = localStorage.getItem('role') || 'student'
      const target = role === 'admin' ? '/admin' : role === 'lecturer' ? '/lecturer' : '/student'
      navigate(target, { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const token = response.data.access_token
      localStorage.setItem('access_token', token)
      localStorage.setItem('student_email', email)

      const meResponse = await api.get('/auth/me')
      const role = meResponse.data.role || 'student'
      localStorage.setItem('role', role)

      if (role === 'admin') {
        navigate('/admin')
      } else if (role === 'lecturer') {
        navigate('/lecturer')
      } else {
        navigate('/student')
      }
    } catch {
      setError('Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-shell">
        <section className="auth-hero">
          <div>
            <p className="eyebrow">Final Year Research Prototype</p>
            <h1>AEL-Edu</h1>
            <h2>AI-Powered Adaptive Learning Management System</h2>
            <p className="auth-hero-copy">Personalized learning analytics using ALWE, topic mastery, and adaptive recommendations.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.label} className="feature-card">
                  <Icon size={20} />
                  <span>{feature.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="auth-card">
          <div>
            <p className="eyebrow"><Sparkles size={13} /> Research dashboard access</p>
            <h2>Welcome back</h2>
            <p className="page-subtitle">Use demo accounts to explore prototype dashboards.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
            <label>
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </label>
            {error && <div className="error-card">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
          </form>

          <div className="demo-box">
            <strong>Demo accounts</strong>
            <div style={{ marginTop: 8 }}>
              <div>Student: student@aeledu.com / 123456</div>
              <div>Lecturer: lecturer@aeledu.com / 123456</div>
              <div>Admin: admin@aeledu.com / 123456</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
