import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, BarChart3, Brain, ClipboardCheck, Target, TrendingUp } from 'lucide-react'
import Badge from '../components/Badge'
import DashboardCard from '../components/DashboardCard'
import DataTable from '../components/DataTable'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import StatCard from '../components/StatCard'
import api from '../services/api'
import {
  categoryVariant,
  clampPercent,
  formatDate,
  formatNumber,
  formatPercent,
  masteryVariant,
  normalizeList,
  priorityVariant,
  scoreVariant,
} from '../utils/formatters'

function normalizeRecommendation(item, index) {
  if (typeof item === 'string') {
    const lower = item.toLowerCase()
    const priority = lower.includes('high') ? 'high' : lower.includes('medium') ? 'medium' : lower.includes('low') ? 'low' : 'medium'
    return {
      id: `legacy-${index}`,
      title: item,
      description: 'Adaptive learning recommendation generated from your latest assessment profile.',
      recommendation_type: 'Learning guidance',
      priority,
      next_action: 'Review this topic and attempt additional practice.',
    }
  }
  return {
    id: item.id ?? `${item.topic_id}-${index}`,
    title: item.title || 'Learning recommendation',
    description: item.description || 'Personalized guidance based on your latest assessment.',
    recommendation_type: item.recommendation_type || 'Adaptive recommendation',
    priority: item.priority || 'medium',
    next_action: item.next_action || 'Continue with targeted revision.',
  }
}

export default function StudentDashboard() {
  const [overview, setOverview] = useState(null)
  const [progress, setProgress] = useState([])
  const [mastery, setMastery] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const load = async () => {
      const requests = await Promise.allSettled([
        api.get('/dashboard/student/overview'),
        api.get('/dashboard/student/progress'),
        api.get('/topic-mastery/my-mastery'),
        api.get('/recommendations/my-recommendations'),
        api.get('/assessments/my-results'),
      ])

      const nextErrors = []
      const [overviewRes, progressRes, masteryRes, recommendationsRes, resultsRes] = requests

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data)
      else nextErrors.push('Overview metrics are temporarily unavailable.')

      if (progressRes.status === 'fulfilled') setProgress(normalizeList(progressRes.value.data))
      else nextErrors.push('Performance trend could not be loaded.')

      if (masteryRes.status === 'fulfilled') setMastery(normalizeList(masteryRes.value.data))
      else nextErrors.push('Topic mastery could not be loaded.')

      if (recommendationsRes.status === 'fulfilled') {
        setRecommendations(normalizeList(recommendationsRes.value.data))
      } else if (overviewRes.status === 'fulfilled') {
        setRecommendations(normalizeList(overviewRes.value.data?.recommendations))
      } else {
        nextErrors.push('Recommendations could not be loaded.')
      }

      if (resultsRes.status === 'fulfilled') setResults(normalizeList(resultsRes.value.data))
      else nextErrors.push('Recent results could not be loaded.')

      setErrors(nextErrors)
      setLoading(false)
    }

    load()
  }, [])

  const chartData = useMemo(() => progress.map((item) => ({
    label: `S${item.session_id}`,
    score: Number(item.percentage || 0),
  })), [progress])

  const sortedMastery = useMemo(() => {
    const order = { weak: 0, moderate: 1, strong: 2 }
    return [...mastery].sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99))
  }, [mastery])

  const latestCategory = overview?.latest_category || ''
  const latestAlwe = overview?.latest_alwe_score
  const recommendationCards = recommendations.map(normalizeRecommendation)

  if (loading) {
    return <div className="page"><DashboardCard><LoadingSpinner label="Loading your personalized dashboard..." /></DashboardCard></div>
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Student learning overview"
        title="Personalized Learning Dashboard"
        subtitle="Your adaptive learning path is updated based on your latest assessment performance."
      />

      {errors.length > 0 && (
        <div className="card error-card">
          Some dashboard sections could not refresh. Available data is still shown below.
        </div>
      )}

      <div className="card hero-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Adaptive study profile</p>
            <h2>Welcome back, {localStorage.getItem('student_name') || 'Student'}</h2>
            <p className="page-subtitle">ALWE scoring, topic mastery, and recommendations update after every completed assessment.</p>
          </div>
          <Badge variant={categoryVariant(latestCategory)}>{latestCategory || 'Not calculated yet'}</Badge>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<ClipboardCheck size={21} />} label="Assessments Completed" value={overview?.total_assessments_completed ?? 0} hint="Across completed sessions" />
        <StatCard icon={<TrendingUp size={21} />} label="Average Performance" value={formatPercent(overview?.average_percentage, 'Not calculated yet')} hint="Rounded to one decimal place" />
        <StatCard icon={<Brain size={21} />} label="Latest ALWE Score" value={formatNumber(latestAlwe, 'Not calculated yet')} hint="Adaptive learning profile score" />
        <StatCard icon={<Award size={21} />} label="Latest Category" value={latestCategory || 'Not calculated yet'} hint="Current learning classification" />
      </div>

      <div className="content-grid two-col">
        <DashboardCard title="Performance Trend" action={<Badge variant="info">Assessment sessions</Badge>} className="chart-card">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 8, right: 14, left: -16, bottom: 4 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tick={{ fill: 'var(--chart-text)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [formatPercent(value), 'Score']}
                  contentStyle={{ background: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', color: 'var(--text-primary)', borderRadius: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No progress data available yet" description="Complete a quiz to see your assessment trend." />}
        </DashboardCard>

        <DashboardCard title="Recommendations" action={<Badge variant="danger">Latest guidance</Badge>}>
          {recommendationCards.length > 0 ? (
            <ul className="stack-list">
              {recommendationCards.map((item) => {
                const priority = String(item.priority || '').toLowerCase()
                return (
                  <li key={item.id} className={`recommendation-card ${priority}-priority`}>
                    <div className="row-between">
                      <strong>{item.title}</strong>
                      <Badge variant={priorityVariant(priority)}>{priority || 'medium'}</Badge>
                    </div>
                    <p className="page-subtitle">{item.description}</p>
                    <div className="row-between" style={{ marginTop: 10 }}>
                      <Badge variant="neutral">{item.recommendation_type}</Badge>
                      <span className="stat-hint">{item.next_action}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : <EmptyState title="No recommendations available yet" description="Your adaptive study guidance will appear after assessment completion." />}
        </DashboardCard>
      </div>

      <div className="content-grid two-col">
        <DashboardCard title="Topic Mastery" action={<Target size={20} color="var(--primary)" />}>
          {sortedMastery.length > 0 ? (
            <ul className="stack-list">
              {sortedMastery.map((item) => {
                const variant = masteryVariant(item.status)
                return (
                  <li key={item.id || item.topic_id}>
                    <div className="row-between">
                      <strong>{item.topic_name || `Topic ${item.topic_id}`}</strong>
                      <Badge variant={variant}>{item.status || 'unknown'}</Badge>
                    </div>
                    <ProgressBar value={clampPercent(item.mastery_percentage)} variant={variant} label="Mastery" />
                    <p className="stat-hint">{item.correct_answers ?? 0} of {item.total_questions ?? 0} questions correct</p>
                  </li>
                )
              })}
            </ul>
          ) : <EmptyState title="No topic mastery calculated yet" description="Topic mastery will appear once an assessment is completed." />}
        </DashboardCard>

        <DashboardCard title="Recent Results" action={<BarChart3 size={20} color="var(--primary)" />}>
          <DataTable
            data={results}
            emptyTitle="No recent results yet"
            emptyDescription="Your latest quiz attempts will appear here."
            columns={[
              { key: 'session', header: 'Session', render: (item) => item.id },
              { key: 'quiz', header: 'Quiz', render: (item) => item.quiz_id },
              { key: 'score', header: 'Score', render: (item) => <Badge variant={scoreVariant(item.percentage)}>{formatPercent(item.percentage, '0.0%')}</Badge> },
              { key: 'status', header: 'Status', render: (item) => <Badge variant={item.completed_at ? 'success' : 'neutral'}>{item.completed_at ? 'Completed' : 'In progress'}</Badge> },
              { key: 'completed_at', header: 'Completed At', render: (item) => formatDate(item.completed_at) },
            ]}
          />
        </DashboardCard>
      </div>
    </div>
  )
}
