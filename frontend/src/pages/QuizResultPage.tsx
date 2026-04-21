import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, CheckCircle, XCircle, Clock, Target, BookOpen, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getQuizAttempt } from '../lib/api'
import { QuizResult } from '../types'
import { GlowCard } from '@/components/ui/spotlight-card'

function ScoreRing({ score }: { score: number }) {
  const data = [{ value: score }, { value: 100 - score }]
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-40 h-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={52} outerRadius={66} startAngle={90} endAngle={-270} dataKey="value">
            <Cell fill={color} />
            <Cell fill="rgba(255,255,255,0.05)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{Math.round(score)}%</span>
        <span className="text-xs text-muted-foreground">Score</span>
      </div>
    </div>
  )
}

export default function QuizResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!attemptId) return
    getQuizAttempt(attemptId).then(res => setResult(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [attemptId])

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6 transition-all duration-700">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mx-auto relative z-10" />
        </div>
        <div className="space-y-3 relative z-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">Calculating Results</h2>
          <p className="text-emerald-400/60 text-sm font-medium animate-pulse">Reviewing your performance insights...</p>
        </div>
      </div>
    </div>
  )

  if (!result) return null

  const { score, correct_answers, total_questions, time_taken_seconds, question_results, weak_topics, document_title } = result
  const mins = Math.floor(time_taken_seconds / 60)
  const secs = time_taken_seconds % 60
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'F'
  const gradeColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Certificate Alert */}
      {(result as any).certificate_token && (
        <GlowCard>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 border-emerald-500/20 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-400" />
             <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-bounce" />
             <h2 className="text-xl font-bold text-foreground mb-2">Certificate of Mastery Earned!</h2>
             <p className="text-sm text-muted-foreground mb-4">You scored above 80% and earned a verifiable digital credential for "{document_title}".</p>
             <Link to={`/certificate/${(result as any).certificate_token}`} className="btn-primary inline-flex">
               View & Download Certificate
             </Link>
          </motion.div>
        </GlowCard>
      )}

      {/* Score card */}
      <GlowCard>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4">
          <Trophy className="w-3 h-3" />
          Quiz Complete
        </div>
        <p className="text-sm text-muted-foreground mb-1 truncate">{document_title}</p>

        <ScoreRing score={score} />

        <div className={`text-5xl font-bold mt-2 ${gradeColor}`}>{grade}</div>
        <p className="text-muted-foreground text-sm mt-1">
          {correct_answers} of {total_questions} correct
        </p>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
          <div>
            <p className="text-xl font-bold text-foreground">{correct_answers}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{total_questions - correct_answers}</p>
            <p className="text-xs text-muted-foreground">Wrong</p>
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{mins}:{String(secs).padStart(2,'0')}</p>
            <p className="text-xs text-muted-foreground">Time</p>
          </div>
        </div>
      </motion.div>
      </GlowCard>

      {/* Weak topics */}
      {weak_topics?.length > 0 && (
        <GlowCard>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm">Weak Topics — Focus here!</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {weak_topics.map(t => (
              <span key={t} className="tag bg-amber-500/10 text-amber-400 border border-amber-500/20">{t}</span>
            ))}
          </div>
        </motion.div>
        </GlowCard>
      )}

      {/* Question breakdown */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
        <h3 className="font-semibold">Question Breakdown</h3>
        {question_results.map((qr, i) => (
          <GlowCard key={i}>
          <div className={`glass-card border ${qr.is_correct ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
            <button
              className="w-full flex items-start gap-3 p-4 text-left"
              onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
            >
              <div className="flex-shrink-0 mt-0.5">
                {qr.is_correct
                  ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                  : <XCircle className="w-5 h-5 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2">{qr.question}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{qr.topic}</p>
              </div>
              {expanded[i] ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            </button>
            {expanded[i] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-4 pb-4 border-t border-border/30 pt-3 space-y-2"
              >
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Your answer: </span>
                    <span className={qr.is_correct ? 'text-emerald-400' : 'text-red-400 line-through'}>
                      {qr.user_answer || '(not answered)'}
                    </span>
                  </div>
                  {!qr.is_correct && (
                    <div>
                      <span className="text-muted-foreground">Correct: </span>
                      <span className="text-emerald-400">{qr.correct_answer}</span>
                    </div>
                  )}
                </div>
                {qr.explanation && (
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 leading-relaxed">
                    💡 {qr.explanation}
                  </p>
                )}
              </motion.div>
            )}
          </div>
          </GlowCard>
        ))}
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link to={`/study/${result.document_id}`} className="btn-secondary flex-1 justify-center">
          <BookOpen className="w-4 h-4" /> Back to Document
        </Link>
        <Link to="/analytics" className="btn-primary flex-1 justify-center">
          <Trophy className="w-4 h-4" /> View Analytics
        </Link>
      </div>
    </div>
  )
}
