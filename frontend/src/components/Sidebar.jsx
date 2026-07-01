import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  NotebookTabs,
  PenLine,
  Settings,
  Sparkles,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { path: '/student', label: 'Student Dashboard', role: 'student', icon: LayoutDashboard },
  { path: '/attempt', label: 'Student Quiz Attempt', role: 'student', icon: PenLine },
  { path: '/results', label: 'Student Results', role: 'student', icon: BarChart3 },
  { path: '/lecturer', label: 'Lecturer Dashboard', role: 'lecturer', icon: LayoutDashboard },
  { path: '/admin', label: 'Admin Dashboard', role: 'admin', icon: Settings },
  { path: '/courses', label: 'Course Management', role: 'staff', icon: BookOpen },
  { path: '/topics', label: 'Topic Management', role: 'staff', icon: NotebookTabs },
  { path: '/questions', label: 'Question Bank', role: 'staff', icon: FileQuestion },
  { path: '/quizzes', label: 'Quiz Management', role: 'staff', icon: ClipboardList },
]

function getRole() {
  return localStorage.getItem('role') || 'student'
}

export default function Sidebar() {
  const role = getRole()
  const navigate = useNavigate()
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('role')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark"><GraduationCap size={24} /></div>
        <div>
          <div className="brand">AEL-Edu</div>
          <p className="brand-subtitle">Adaptive Learning Research Prototype</p>
        </div>
      </div>
      <div className="sidebar-tools">
        <div className="role-chip"><Sparkles size={14} /> {roleLabel} workspace</div>
        <ThemeToggle className="sidebar-theme-toggle" />
      </div>
      <nav className="nav-list">
        {navItems
          .filter((item) => item.role === role || (item.role === 'staff' && role !== 'student'))
          .map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} className="nav-link">
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
      </nav>
      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Sign out</span>
      </button>
    </aside>
  )
}
