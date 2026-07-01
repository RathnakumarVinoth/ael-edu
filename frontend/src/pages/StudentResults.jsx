import { useEffect, useMemo, useState } from 'react'
import { Award, BarChart3, Brain, Target } from 'lucide-react'
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

const interpretations = [
  ['advanced', 'The learner is performing strongly and can attempt advanced tasks.'],
  ['good', 'The learner is progressing well with minor improvement areas.'],
  ['average', 'The learner needs more practice to improve consistency.'],
  ['weak', 'The learner needs guided revision and additional practice.'],
  ['risk', 'The learner requires urgent support and recovery activities.'],
]

function interpretationFor(category) {
  const lower = String(category || '').toLowerCase()
  return interpretations.find(([key]) => lower.includes(key))?.[1] || 'Complete an assessment to generate an ALWE interpretation.'
}

export default function StudentResults() {
  const [results, setResults] = useState([])
  const [alweScores, setAlweScores] = useState([])
  const [mastery, setMastery] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const requests = await Promise.allSettled([
        api.get('/assessments/my-results'),
        api.get('/alwe/my-scores'),
        api.get('/topic-mastery/my-mastery'),
        api.get('/recommendations/my-recommendations'),
      ])
      if (requests[0].status === 'fulfilled') setResults(normalizeList(requests[0].value.data))
      if (requests[1].status === 'fulfilled') setAlweScores(normalizeList(requests[1].value.data))
      if (requests[2].status === 'fulfilled') setMastery(normalizeList(requests[2].value.data))
      if (requests[3].status === 'fulfilled') setRecommendations(normalizeList(requests[3].value.data))
      if (requests.some((request) => request.status === 'rejected')) setError('Some result sections could not refresh. Available data is shown below.')
      setLoading(false)
    }

    load()
  }, [])

  const latestAlwe = useMemo(() => {
    return [...alweScores].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || (b.id || 0) - (a.id || 0))[0]
  }, [alweScores])

  const sortedMastery = useMemo(() => {
    const order = { weak: 0, moderate: 1, strong: 2 }
    return [...mastery].sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99))
  }, [mastery])

  if (loading) {
    return <div className="page"><DashboardCard><LoadingSpinner label="Loading results..." /></DashboardCard></div>
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Assessment reflection"
        title="Student Results"
        subtitle="Review completed assessments, ALWE outcomes, and adaptive recommendations in one place."
      />

      {error && <div className="card error-card">{error}</div>}

      <div className="stats-grid">
        <StatCard icon={<BarChart3 size={21} />} label="Completed Assessments" value={results.length} hint="Total completed sessions" />
        <StatCard icon={<Award size={21} />} label="Latest Score" value={formatPercent(results[results.length - 1]?.percentage, 'Not calculated yet')} hint="Most recent assessment percentage" />
        <StatCard icon={<Brain size={21} />} label="Latest ALWE" value={formatNumber(latestAlwe?.score, 'Not calculated yet')} hint="Adaptive learning score" />
        <StatCard icon={<Target size={21} />} label="Latest Category" value={latestAlwe?.category || 'Not calculated yet'} hint="ALWE classification" />
      </div>

      <div className="content-grid two-col">
        <DashboardCard title="Assessment History">
          <DataTable
            data={results}
            emptyTitle="No results yet"
            emptyDescription="Your assessment history will appear here after completing a quiz."
            columns={[
              { key: 'id', header: 'Session', render: (item) => item.id },
              { key: 'quiz_id', header: 'Quiz', render: (item) => item.quiz_id },
              { key: 'percentage', header: 'Score', render: (item) => <Badge variant={scoreVariant(item.percentage)}>{formatPercent(item.percentage, '0.0%')}</Badge> },
              { key: 'status', header: 'Status', render: (item) => <Badge variant={item.completed_at ? 'success' : 'neutral'}>{item.completed_at ? 'Completed' : 'In progress'}</Badge> },
              { key: 'completed_at', header: 'Completed Date', render: (item) => formatDate(item.completed_at) },
            ]}
          />
        </DashboardCard>

        <DashboardCard title="Latest ALWE Summary" action={<Badge variant={categoryVariant(latestAlwe?.category)}>{latestAlwe?.category || 'Not calculated yet'}</Badge>}>
          {latestAlwe ? (
            <div className="mini-card">
              <div className="row-between">
                <div>
                  <p className="muted">ALWE score</p>
                  <h2>{formatNumber(latestAlwe.score, '0.0')}</h2>
                </div>
                <Badge variant={categoryVariant(latestAlwe.category)}>{latestAlwe.category}</Badge>
              </div>
              <ProgressBar value={latestAlwe.score || 0} label="ALWE score" />
              <p className="page-subtitle">{interpretationFor(latestAlwe.category)}</p>
            </div>
          ) : <EmptyState title="No ALWE summary yet" description="Complete a quiz to generate your ALWE classification." />}
        </DashboardCard>
      </div>

      <div className="content-grid two-col">
        <DashboardCard title="Topic Mastery">
          {sortedMastery.length > 0 ? (
            <ul className="stack-list">
              {sortedMastery.map((item) => {
                const variant = masteryVariant(item.status)
                return (
                  <li key={item.id || item.topic_id}>
                    <div className="row-between">
                      <strong>{item.topic_name || `Topic ${item.topic_id}`}</strong>
                      <Badge variant={variant}>{item.status}</Badge>
                    </div>
                    <ProgressBar value={clampPercent(item.mastery_percentage)} variant={variant} label="Mastery" />
                    <p className="stat-hint">{item.obtained_marks ?? 0} of {item.total_marks ?? 0} marks obtained</p>
                  </li>
                )
              })}
            </ul>
          ) : <EmptyState title="No topic mastery calculated yet" description="Mastery data appears after assessment analysis." />}
        </DashboardCard>

        <DashboardCard title="Recommendations">
          {recommendations.length > 0 ? (
            <ul className="stack-list">
              {recommendations.map((item) => {
                const priority = String(item.priority || 'medium').toLowerCase()
                return (
                  <li key={item.id} className={`recommendation-card ${priority}-priority`}>
                    <div className="row-between">
                      <strong>{item.title || 'Learning recommendation'}</strong>
                      <Badge variant={priorityVariant(priority)}>{priority}</Badge>
                    </div>
                    <p className="page-subtitle">{item.description || 'Personalized guidance based on your latest assessment.'}</p>
                    <p className="stat-hint" style={{ marginTop: 8 }}>{item.next_action || 'Continue with targeted revision.'}</p>
                  </li>
                )
              })}
            </ul>
          ) : <EmptyState title="No recommendations yet" description="Recommendations will appear after topic mastery is calculated." />}
        </DashboardCard>
      </div>
    </div>
  )
}
