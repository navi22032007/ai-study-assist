import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { GraduationCap, Sparkles, Brain, Zap, BarChart3, Shield, ArrowRight, Check } from 'lucide-react'
import { BackgroundPaths } from '@/components/ui/background-paths'
import { GlowCard } from '@/components/ui/spotlight-card'

const features = [
  { icon: Brain, title: 'AI Summaries', desc: 'Get crisp 200-word summaries grounded in your document instantly.' },
  { icon: Sparkles, title: 'Smart Flashcards', desc: 'Auto-generated flashcards for active recall and spaced repetition.' },
  { icon: Zap, title: 'Timed Quizzes', desc: 'MCQ, True/False, Fill-in-the-blank with timer and score history.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track your progress, streaks, and detect weak topics over time.' },
  { icon: Shield, title: 'Document Chat', desc: 'Ask anything — answers are strictly grounded in your content.' },
  { icon: GraduationCap, title: 'Mind Maps', desc: 'Visual concept maps auto-generated from your uploaded document.' },
]

export default function LandingPage() {
  const [showHero, setShowHero] = useState(true)

  return (
    <>
      <AnimatePresence>
        {showHero && (
          <motion.div
            key="paths-hero"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="fixed inset-0 z-[90]"
          >
            <BackgroundPaths
              title="Study Smarter"
              buttonText="Enter StudyAI"
              onButtonClick={() => setShowHero(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center">
            <GraduationCap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">StudyAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/login" className="btn-primary">Get Started <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Google Gemini AI
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Study Smarter with<br />
            <span className="gradient-text">AI-Powered</span> Insights
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload any PDF or text document and instantly get AI-generated summaries, flashcards, 
            quizzes, and mind maps. Track your progress and ace your exams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="btn-primary text-base px-8 py-3">
              Start Studying Free <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-muted-foreground">No credit card required</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-16">
            {[
              { value: '10x', label: 'Faster Review' },
              { value: '200+', label: 'Word Summaries' },
              { value: '∞', label: 'Documents' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold gradient-text">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to study effectively</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From upload to quiz results in minutes. AI does the heavy lifting so you can focus on learning.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <GlowCard key={title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card-hover p-6"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-600/20 border border-sky-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-sky-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <GlowCard className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to study smarter?</h2>
            <p className="text-muted-foreground mb-8">Join students already using StudyAI to transform their learning.</p>
            <Link to="/login" className="btn-primary text-base px-8 py-3">
              Get Started — It's Free <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
              {['Google Sign-in', 'PDF & TXT support', 'No credit card'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> {item}
                </span>
              ))}
            </div>
          </motion.div>
        </GlowCard>
      </section>

      <footer className="border-t border-border/50 py-6 px-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} StudyAI — Built for SYNERGY Club Full Stack Challenge</p>
      </footer>
    </div>
    </>
  )
}
