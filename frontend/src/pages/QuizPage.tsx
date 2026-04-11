import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { getQuiz, submitQuiz } from '../lib/api'
import { Quiz, QuizQuestion, QuizAnswer } from '../types'
import { GlowCard } from '@/components/ui/spotlight-card'

function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = (seconds / total) * 100
  const color = pct > 50 ? 'from-emerald-500 to-emerald-400' : pct > 25 ? 'from-amber-500 to-amber-400' : 'from-red-500 to-red-400'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className={`font-mono font-bold ${pct <= 25 ? 'text-red-400' : pct <= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{Math.round(pct)}% remaining</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </div>
  )
}

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [fillInput, setFillInput] = useState('')
  const [startTime] = useState(Date.now())

  useEffect(() => {
    if (!quizId) return
    getQuiz(quizId).then(res => {
      if (res.data.attempted) {
        alert('This quiz has already been attempted.')
        navigate(-1)
        return
      }
      setQuiz(res.data)
      const t = (res.data.time_limit_minutes || 15) * 60
      setTimeLeft(t)
      setTotalTime(t)
    }).catch(() => navigate(-1)).finally(() => setLoading(false))
  }, [quizId])

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (!quiz || submitting) return
    
    const answeredCount = Object.keys(answers).length
    if (!autoSubmit && answeredCount < quiz.questions.length) {
      const confirm = window.confirm(`You've answered ${answeredCount}/${quiz.questions.length} questions. Submit anyway?`)
      if (!confirm) return
    }

    setSubmitting(true)
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    const answersList: QuizAnswer[] = quiz.questions.map(q => ({
      question_id: q.id,
      answer: answers[q.id] || ''
    }))

    try {
      const res = await submitQuiz({ quiz_id: quiz.id, answers: answersList, time_taken_seconds: timeTaken })
      navigate(`/result/${res.data.id}`)
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Submission failed')
      setSubmitting(false)
    }
  }, [quiz, answers, submitting, startTime])

  const handleSubmitRef = useRef(handleSubmit)
  useEffect(() => { handleSubmitRef.current = handleSubmit }, [handleSubmit])

  // Timer countdown
  useEffect(() => {
    if (!quiz || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval)
          handleSubmitRef.current(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [quiz])

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="skeleton h-8 w-64 rounded-xl" />
      <div className="skeleton h-4 rounded-xl" />
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  )

  if (!quiz) return null

  const question = quiz.questions[current]
  const progress = ((current + 1) / quiz.questions.length) * 100

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-bold text-lg text-foreground">{quiz.document_title}</h1>
          <span className={`tag ${
            quiz.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            quiz.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          } border`}>{quiz.difficulty}</span>
        </div>
        <p className="text-sm text-muted-foreground">Question {current + 1} of {quiz.questions.length}</p>
      </div>

      {/* Timer */}
      <TimerBar seconds={timeLeft} total={totalTime} />

      {/* Progress dots */}
      <div className="flex gap-1.5 flex-wrap">
        {quiz.questions.map((q, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
              i === current ? 'bg-primary text-primary-foreground' :
              answers[q.id] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <GlowCard>
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {current + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`tag text-xs border ${
                      question.type === 'mcq' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      question.type === 'true_false' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {question.type === 'mcq' ? 'MCQ' : question.type === 'true_false' ? 'True / False' : 'Fill in Blank'}
                    </span>
                    <span className="text-xs text-muted-foreground">{question.topic}</span>
                  </div>
                  <p className="text-foreground font-medium leading-relaxed">{question.question}</p>
                </div>
              </div>

              {/* Answer options */}
              <div className="space-y-2">
                {(question.type === 'mcq' || question.type === 'true_false') && question.options?.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => handleAnswer(question.id, opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      answers[question.id] === opt
                        ? 'bg-primary/10 border-primary/50 text-primary'
                        : 'bg-muted/30 border-border/50 text-foreground hover:bg-muted/60 hover:border-border'
                    }`}
                  >
                    <span className="inline-flex w-6 h-6 rounded-lg bg-muted items-center justify-center text-xs font-bold mr-3">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                ))}

                {question.type === 'fill_blank' && (
                  <input
                    className="input-field"
                    placeholder="Type your answer..."
                    value={answers[question.id] || ''}
                    onChange={e => handleAnswer(question.id, e.target.value)}
                  />
                )}
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <span className="text-xs text-muted-foreground">
          {Object.keys(answers).length}/{quiz.questions.length} answered
        </span>

        {current < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} className="btn-primary">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="btn-primary bg-gradient-to-r from-emerald-500 to-teal-600"
          >
            {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><CheckCircle className="w-4 h-4" /> Submit Quiz</>}
          </button>
        )}
      </div>
    </div>
  )
}
