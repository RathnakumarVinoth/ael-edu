import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/student', label: 'Student Dashboard', role: 'student' },
  { path: '/lecturer', label: 'Lecturer Dashboard', role: 'lecturer' },
  { path: '/admin', label: 'Admin Dashboard', role: 'admin' },
  { path: '/courses', label: 'Course Management', role: 'all' },
  { path: '/topics', label: 'Topic Management', role: 'all' },
  { path: '/questions', label: 'Question Bank', role: 'all' },
  { path: '/quizzes', label: 'Quiz Management', role: 'all' },
  { path: '/attempt', label: 'Student Quiz Attempt', role: 'student' },
  { path: '/results', label: 'Student Results', role: 'student' },
]

function getRole() {
  return localStorage.getItem('role') || 'student'
}

export default function Sidebar() {
  const role = getRole()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('role')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand">AEL-Edu</div>
        <p className="brand-subtitle">Research prototype</p>
      </div>
      <nav>
        {navItems
          .filter((item) => item.role === 'all' || item.role === role)
          .map((item) => (
            <NavLink key={item.path} to={item.path} className="nav-link">
              {item.label}
            </NavLink>
          ))}
      </nav>
      <button type="button" className="btn-secondary logout-btn" onClick={handleLogout}>
        Sign out
      </button>
    </aside>
  )
}
