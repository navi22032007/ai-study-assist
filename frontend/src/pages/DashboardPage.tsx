import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart3, BookOpen, Trophy, Flame, Target, Upload, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { getDashboardAnalytics, listDocuments } from '../lib/api'
import { AnalyticsDashboard, Document } from '../types'
import { useAuthStore } from '../store/authStore'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { GlowCard } from '@/components/ui/spotlight-card'

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <GlowCard>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </motion.div>
    </GlowCard>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className}`} style={{ minHeight: 20 }} />
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null)
  const [recentDocs, setRecentDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, docsRes] = await Promise.all([
          getDashboardAnalytics(),
          listDocuments(),
        ])
        setAnalytics(analyticsRes.data)
        setRecentDocs(docsRes.data.documents.slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const chartData = analytics?.score_history?.slice(-10).map((h) => ({
    date: new Date(h.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    score: Math.round(h.score),
  })) || []

  return (
    <AnimatedGroup preset="blur-slide" className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Welcome back, <span className="gradient-text">{user?.display_name?.split(' ')[0] || 'Learner'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's your study overview</p>
        </div>
        <Link to="/upload" className="btn-primary">
          <Upload className="w-4 h-4" /> Upload Doc
        </Link>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Documents" value={analytics?.total_documents ?? 0} sub="Uploaded" color="bg-emerald-500/10 text-emerald-400" />
          <StatCard icon={Trophy} label="Quizzes" value={analytics?.total_quizzes ?? 0} sub="Attempted" color="bg-amber-500/10 text-amber-400" />
          <StatCard icon={BarChart3} label="Avg Score" value={`${analytics?.average_score?.toFixed(1) ?? 0}%`} sub="All time" color="bg-emerald-500/10 text-emerald-400" />
          <StatCard icon={Flame} label="Streak" value={`${analytics?.study_streak ?? 0} days`} sub="Keep it up!" color="bg-amber-500/10 text-amber-400" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score History Chart */}
        <GlowCard className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold">Score History</h2>
            </div>
            {loading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#0ea5e9" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: '#0ea5e9', strokeWidth: 0, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No quiz history yet. Take your first quiz!</p>
              </div>
            )}
          </div>
        </GlowCard>

        {/* Weak Topics */}
        <GlowCard>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold">Weak Topics</h2>
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
            ) : analytics?.weak_topics?.length ? (
              <div className="space-y-2">
                {analytics.weak_topics.map((topic, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">{topic}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Trophy className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm text-center">No weak topics detected yet!</p>
              </div>
            )}
          </div>
        </GlowCard>
      </div>

      {/* Recent Documents */}
      <GlowCard>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold">Recent Documents</h2>
            </div>
            <Link to="/library" className="btn-ghost text-xs">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : recentDocs.length > 0 ? (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/study/${doc.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-600/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.folder} · {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <BookOpen className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm mb-4">No documents yet. Upload your first one!</p>
              {null}
            </div>
          )}
        </div>
      </GlowCard>
    </AnimatedGroup>
  )
}
