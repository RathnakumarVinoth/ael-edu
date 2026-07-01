import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import Badge from '../components/Badge'
import DashboardCard from '../components/DashboardCard'
import DataTable from '../components/DataTable'
import FormCard from '../components/FormCard'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import api from '../services/api'
import { displayValue, formatDate, normalizeList } from '../utils/formatters'

const initialForm = {
  course_name: '',
  course_code: '',
  description: '',
}

export default function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')

  const loadCourses = async () => {
    const response = await api.get('/courses')
    setCourses(normalizeList(response.data))
  }

  useEffect(() => {
    const load = async () => {
      try {
        await loadCourses()
      } catch {
        setMessageType('error')
        setMessage('Unable to load courses right now.')
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    try {
      await api.post('/courses', form)
      setMessageType('success')
      setMessage('Course added successfully.')
      setForm(initialForm)
      await loadCourses()
    } catch {
      setMessageType('error')
      setMessage('Unable to add course right now.')
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Curriculum administration"
        title="Course Management"
        subtitle="Create and review course records used across adaptive quizzes, topics, and analytics."
      />

      {message && <div className={`card ${messageType === 'success' ? 'success-card' : 'error-card'}`}>{message}</div>}

      <div className="content-grid two-col">
        <FormCard title="Add Course" eyebrow="Course details">
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>Course name<input name="course_name" value={form.course_name} onChange={handleChange} required /></label>
            <label>Course code<input name="course_code" value={form.course_code} onChange={handleChange} required /></label>
            <label>Description<textarea name="description" value={form.description} onChange={handleChange} rows="4" /></label>
            <button className="btn-primary" type="submit"><Plus size={18} /> Save course</button>
          </form>
        </FormCard>

        <DashboardCard title="Course Catalogue" action={<Badge variant="primary">{courses.length} courses</Badge>}>
          {loading ? <LoadingSpinner label="Loading courses..." /> : (
            <DataTable
              data={courses}
              emptyTitle="No courses yet"
              emptyDescription="Add a course to begin structuring the learning content."
              columns={[
                { key: 'course_name', header: 'Course Name', render: (course) => <strong>{course.course_name}</strong> },
                { key: 'course_code', header: 'Course Code', render: (course) => <Badge variant="neutral">{course.course_code}</Badge> },
                { key: 'description', header: 'Description', render: (course) => displayValue(course.description) },
                { key: 'created_at', header: 'Created At', render: (course) => formatDate(course.created_at) },
              ]}
            />
          )}
        </DashboardCard>
      </div>
    </div>
  )
}
