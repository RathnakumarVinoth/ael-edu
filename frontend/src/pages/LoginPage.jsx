import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

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
    } catch (err) {
      setError('Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-hero">
          <div>
            <p className="eyebrow">Final Year Research Prototype</p>
            <h1>AEL-Edu</h1>
            <h2>AI-Powered Adaptive Learning Management System</h2>
            <p style={{ marginTop: 10, color: '#cbd5e1' }}>Multi-factor competency assessment and emotion-aware learning analytics for adaptive education research.</p>
          </div>
          <ul>
            <li>Adaptive assessments</li>
            <li>ALWE-based student classification</li>
            <li>Personalized learning recommendations</li>
          </ul>
        </div>
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="page-subtitle">Sign in to continue to your research dashboard.</p>
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
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div className="demo-box" style={{ marginTop: 16 }}>
            <strong>Demo accounts</strong>
            <div style={{ marginTop: 8 }}>
              <div>Student: student@aeledu.com / 123456</div>
              <div>Lecturer: lecturer@aeledu.com / 123456</div>
              <div>Admin: admin@aeledu.com / 123456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
