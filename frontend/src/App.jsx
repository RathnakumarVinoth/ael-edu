import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import AdminDashboard from './pages/AdminDashboard'
import CourseManagement from './pages/CourseManagement'
import LecturerDashboard from './pages/LecturerDashboard'
import LoginPage from './pages/LoginPage'
import QuestionBank from './pages/QuestionBank'
import QuizManagement from './pages/QuizManagement'
import StudentDashboard from './pages/StudentDashboard'
import StudentQuizAttempt from './pages/StudentQuizAttempt'
import StudentResults from './pages/StudentResults'
import TopicManagement from './pages/TopicManagement'

function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  )
}

function HomeRedirect() {
  const role = localStorage.getItem('role') || 'student'
  const target = role === 'admin' ? '/admin' : role === 'lecturer' ? '/lecturer' : '/student'
  return <Navigate to={target} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/lecturer" element={<LecturerDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/courses" element={<CourseManagement />} />
          <Route path="/topics" element={<TopicManagement />} />
          <Route path="/questions" element={<QuestionBank />} />
          <Route path="/quizzes" element={<QuizManagement />} />
          <Route path="/attempt" element={<StudentQuizAttempt />} />
          <Route path="/results" element={<StudentResults />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
