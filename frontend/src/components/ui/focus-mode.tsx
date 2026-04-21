import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Focus, AlertTriangle, X, CheckCircle2, Trophy } from 'lucide-react'
import { reportViolation, getMe } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface FocusModeProps {
  onClose: () => void
}

export const FocusMode: React.FC<FocusModeProps> = ({ onClose }) => {
  const [violations, setViolations] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isSplash, setIsSplash] = useState(true)
  const [showWarning, setShowWarning] = useState(false)
  const [timer, setTimer] = useState(0)
  const setUser = useAuthStore((state) => state.setUser)
  const user = useAuthStore((state) => state.user)

  const handleViolation = useCallback(async () => {
    if (violations < 3) {
      const newViolations = violations + 1
      setViolations(newViolations)
      setShowWarning(true)
      
      try {
        await reportViolation()
        const userRes = await getMe()
        setUser(userRes.data)
      } catch (err) {
        console.error('Failed to report violation:', err)
      }

      if (newViolations >= 3) {
        setTimeout(() => {
          exitFocusMode()
        }, 3000)
      }
    }
  }, [violations, setUser])

  const exitFocusMode = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err))
    }
    setIsActive(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setIsSplash(false)
    }, 2000)

    const timerInterval = setInterval(() => {
      setTimer(prev => prev + 1)
    }, 1000)

    return () => {
      clearTimeout(splashTimeout)
      clearInterval(timerInterval)
    }
  }, [])

  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen()
        }
        setIsActive(true)
      } catch (err) {
        console.error('Error entering fullscreen:', err)
        setIsActive(true) 
      }
    }

    enterFullscreen()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isActive) {
        handleViolation()
      }
    }

    const handleBlur = () => {
      if (isActive) {
        handleViolation()
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        handleViolation()
      }
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isActive, handleViolation, onClose])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <AnimatePresence>
        {isSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-3xl flex items-center justify-center overflow-hidden"
          >
            {/* Floating Color Animation Background */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 180, 270, 360],
                  x: [0, 100, 0, -100, 0],
                  y: [0, -100, 0, 100, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"
              />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-2xl px-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
              >
                <Focus className="w-12 h-12 text-primary animate-pulse" />
              </motion.div>

              <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl font-black tracking-tight"
                >
                  Focus Mode
                </motion.h1>
                <p className="text-xl text-muted-foreground font-medium">
                  Initializing distraction-free environment...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Mini-Game / Timer Widget */}
      <AnimatePresence>
        {!isSplash && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed bottom-24 right-8 z-[9998] flex flex-col gap-3 items-end"
          >
            <div className="glass-card p-4 flex flex-col items-center gap-2 border-primary/30 min-w-[140px] shadow-primary/10">
              <div className="flex items-center gap-2 text-primary">
                <Trophy className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Focus Session</span>
              </div>
              <div className="text-2xl font-black font-mono">
                {formatTime(timer)}
              </div>
              <div className="w-full bg-primary/10 h-1.5 rounded-full overflow-hidden mt-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 60, repeat: Infinity }}
                  className="bg-primary h-full"
                />
              </div>
              <div className="flex gap-1 mt-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < violations ? 'bg-destructive' : 'bg-primary/20'}`}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={exitFocusMode}
              className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-black uppercase hover:bg-destructive/20 transition-all backdrop-blur-md"
            >
              End Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Violation Apprehension Layer (only visible during warning) */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-background/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="p-8 glass-card border-destructive/50 bg-destructive/10 text-destructive flex flex-col items-center gap-4 max-w-sm text-center"
            >
              <AlertTriangle className="w-16 h-16" />
              <h2 className="text-3xl font-black uppercase">Violation Detected!</h2>
              <p className="text-lg font-semibold">-30 XP Deducted</p>
              <div className="p-3 bg-destructive/20 rounded-xl font-bold flex gap-2">
                Attempts Remaining: <span className="text-xl">{3 - violations}</span>
              </div>
              <button 
                onClick={() => setShowWarning(false)}
                className="btn-primary hover:bg-destructive/20 bg-destructive/10 text-destructive border-destructive/20 mt-4 px-10 w-full"
              >
                Back to Focus
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {violations >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[10001] bg-destructive flex flex-col items-center justify-center text-destructive-foreground p-10 text-center"
        >
          <X className="w-32 h-32 mb-8" />
          <h1 className="text-7xl font-black mb-4 uppercase">Focus Lost</h1>
          <p className="text-3xl font-bold opacity-80">Max violations reached.</p>
        </motion.div>
      )}
    </>
  )
}
