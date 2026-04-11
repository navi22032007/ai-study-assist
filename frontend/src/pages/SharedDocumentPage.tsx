import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, BookOpen, AlertCircle, Clock, Sparkles, Brain } from 'lucide-react'
import { getSharedDocument } from '../lib/api'
import { Document } from '../types'
import { GlowCard } from '@/components/ui/spotlight-card'

export default function SharedDocumentPage() {
  const { token } = useParams<{ token: string }>()
  const [doc, setDoc] = useState<Document | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getSharedDocument(token)
      .then(r => setDoc(r.data))
      .catch(e => {
        if (e.response?.status === 410) setError('This share link has expired.')
        else if (e.response?.status === 404) setError('Share link not found.')
        else setError('Failed to load shared document.')
      })
      .finally(() => setLoading(false))
  }, [token])

  const impColors: Record<string, string> = {
    high: 'bg-red-500/10 text-red-400 border border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 px-6 py-4 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">StudyAI</span>
        </div>
        <Link to="/login" className="btn-primary text-xs px-4 py-2">Sign in to Study</Link>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {loading && (
          <div className="space-y-4 mt-8">
            <div className="skeleton h-10 w-72 rounded-xl" />
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Link Unavailable</h2>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Link to="/" className="btn-primary mt-6 inline-flex">Go Home</Link>
          </motion.div>
        )}

        {doc && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <GlowCard>
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-violet-600/20 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-sky-400" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-foreground">{doc.title}</h1>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{doc.folder}</span>
                    <span>·</span>
                    <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                    {doc.share_expires_at && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {new Date(doc.share_expires_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </GlowCard>

            {/* Summary */}
            {doc.summary && (
              <GlowCard>
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <h2 className="font-semibold">AI Summary</h2>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{doc.summary}</p>
              </div>
              </GlowCard>
            )}

            {/* Key Points */}
            {doc.key_points && doc.key_points.length > 0 && (
              <GlowCard>
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-violet-400" />
                  <h2 className="font-semibold">Key Points</h2>
                </div>
                <div className="space-y-3">
                  {doc.key_points.map((kp, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${impColors[kp.importance_level]}`}>
                        {kp.importance_level}
                      </span>
                      <p className="text-sm text-foreground leading-relaxed">{kp.point}</p>
                    </div>
                  ))}
                </div>
              </div>
              </GlowCard>
            )}

            {/* CTA */}
            <GlowCard>
            <div className="glass-card p-6 text-center">
              <h3 className="font-semibold mb-2">Want to generate quizzes & flashcards?</h3>
              <p className="text-sm text-muted-foreground mb-4">Sign in to unlock the full StudyAI experience — free!</p>
              <Link to="/login" className="btn-primary">
                <GraduationCap className="w-4 h-4" /> Get Started Free
              </Link>
            </div>
            </GlowCard>
          </motion.div>
        )}
      </div>
    </div>
  )
}
