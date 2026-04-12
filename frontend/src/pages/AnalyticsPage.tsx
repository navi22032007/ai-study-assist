import { useEffect, useState } from 'react'
import { BarChart3, Trophy, Target, TrendingUp, BookOpen } from 'lucide-react'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { GlowCard } from '@/components/ui/spotlight-card'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { getDashboardAnalytics } from '../lib/api'
import { AnalyticsDashboard } from '../types'

const SCORE_COLORS = ['#ef4444', '#f59e0b', '#10b981']
const getScoreColor = (s: number) => s >= 80 ? SCORE_COLORS[2] : s >= 60 ? SCORE_COLORS[1] : SCORE_COLORS[0]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardAnalytics().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="skeleton h-10 w-56 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )

  const scoreHistory = data?.score_history?.slice(-14).map(h => ({
    date: new Date(h.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    score: Math.round(h.score),
    difficulty: h.difficulty
  })) || []

  const topicData = data?.topic_performance?.slice(0, 8) || []

  return (
    <AnimatedGroup preset="blur-slide" className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="page-title gradient-text">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your study progress and performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Documents', value: data?.total_documents ?? 0, color: 'bg-emerald-500/10 text-emerald-400' },
          { icon: Trophy, label: 'Quizzes Taken', value: data?.total_quizzes ?? 0, color: 'bg-amber-500/10 text-amber-400' },
          { icon: BarChart3, label: 'Avg Score', value: `${data?.average_score?.toFixed(1) ?? 0}%`, color: 'bg-emerald-500/10 text-emerald-400' },
          { icon: BarChart3, label: 'Best Score', value: `${data?.best_score?.toFixed(1) ?? 0}%`, color: 'bg-amber-500/10 text-amber-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <GlowCard key={label}>
            <div className="glass-card p-5">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          </GlowCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score History */}
        <GlowCard>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold">Score History</h2>
            </div>
            {scoreHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={scoreHistory}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#0ea5e9" fill="url(#sg)" strokeWidth={2.5}
                    dot={(props) => <circle {...props} r={4} fill={getScoreColor(props.payload.score)} stroke="none" />}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No quiz history yet
              </div>
            )}
          </div>
        </GlowCard>

        {/* Topic Performance */}
        <GlowCard>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold">Topic Performance</h2>
            </div>
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                    {topicData.map((entry, i) => (
                      <Cell key={i} fill={getScoreColor(entry.accuracy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No topic data yet
              </div>
            )}
          </div>
        </GlowCard>
      </div>

      {/* Weak topics + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowCard>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold">Weak Topics</h2>
            </div>
            {data?.weak_topics?.length ? (
              <div className="space-y-2">
                {data.weak_topics.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <span className="text-amber-400 text-sm font-bold">{i + 1}</span>
                    <span className="text-sm text-foreground">{t}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No weak topics — great work!</p>
            )}
          </div>
        </GlowCard>

        <GlowCard>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold">Recent Activity</h2>
            </div>
            {data?.recent_activity?.length ? (
              <div className="space-y-3">
                {data.recent_activity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{a.document_title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(a.score)}`}>{Math.round(a.score)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No recent activity yet</p>
            )}
          </div>
        </GlowCard>
      </div>
    </AnimatedGroup>
  )
}
