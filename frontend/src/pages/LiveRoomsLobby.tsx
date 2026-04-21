import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Users, Sparkles, ArrowRight, Hash, 
  MessageSquare, BrainCircuit, Swords, Play,
  Zap, Globe, Shield
} from 'lucide-react'
import { GlowCard } from '@/components/ui/spotlight-card'
import { AnimatedGroup } from '@/components/ui/animated-group'

export default function LiveRoomsLobby() {
  const [roomCode, setRoomCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return
    navigate(`/room/${roomCode.trim().toUpperCase()}`)
  }

  const handleCreate = () => {
    setIsCreating(true)
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setTimeout(() => {
      navigate(`/room/${randomId}`)
    }, 800)
  }

  return (
    <AnimatedGroup preset="blur-slide" className="p-6 max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto border border-primary/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
        >
          <Users className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-5xl font-black tracking-tight gradient-text">Collaborative Study Rooms</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Study together in real-time. Build mind maps, compete in quiz battles, and discuss complex topics with your peers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Create Room Card */}
        <GlowCard className="h-full">
          <div className="glass-card p-8 flex flex-col h-full bg-primary/5 border-primary/20">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-2">
                <Sparkles className="w-4 h-4" /> New Session
              </div>
              <h2 className="text-2xl font-black">Host a Room</h2>
              <p className="text-muted-foreground text-sm mt-1">Start a private study session and invite your friends via a shared code.</p>
            </div>
            
            <div className="flex-1 space-y-4 mb-8">
              <FeatureItem icon={BrainCircuit} label="Shared Mind Maps" />
              <FeatureItem icon={Swords} label="Live Quiz Battles" />
              <FeatureItem icon={MessageSquare} label="Contextual Chat" />
            </div>

            <button 
              onClick={handleCreate}
              disabled={isCreating}
              className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-primary/20"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current" /> Create Live Room
                </div>
              )}
            </button>
          </div>
        </GlowCard>

        {/* Join Room Card */}
        <GlowCard className="h-full">
          <div className="glass-card p-8 flex flex-col h-full">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-widest text-xs mb-2">
                <Globe className="w-4 h-4" /> Existing Session
              </div>
              <h2 className="text-2xl font-black">Join a Room</h2>
              <p className="text-muted-foreground text-sm mt-1">Found a code? Enter it below to join an active study group instantly.</p>
            </div>

            <form onSubmit={handleJoin} className="space-y-6">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Hash className="w-5 h-5" />
                </div>
                <input 
                  type="text"
                  placeholder="ENTER ROOM CODE"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value)}
                  className="input-field w-full pl-12 py-4 text-xl font-mono tracking-[0.5em] text-center uppercase placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                />
              </div>

              <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 text-xs text-muted-foreground leading-relaxed flex gap-3">
                <Shield className="w-8 h-8 text-muted-foreground/50 flex-shrink-0" />
                No login required for peers. Just share the code and start collaborating on documents.
              </div>

              <button 
                type="submit"
                disabled={!roomCode.trim()}
                className="btn-secondary w-full py-4 text-lg font-bold mt-auto"
              >
                Join Room <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </GlowCard>
      </div>

      {/* Stats / Motivation */}
      <div className="flex justify-center gap-12 text-center pb-8 border-b border-border/50">
        <Stat icon={Users} val="250+" label="Active Today" />
        <Stat icon={Zap} val="1.2k" label="Study Battles" />
        <Stat icon={Globe} val="42" label   ="Countries" />
      </div>
    </AnimatedGroup>
  )
}

function FeatureItem({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-foreground/80">
      <div className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      {label}
    </div>
  )
}

function Stat({ icon: Icon, val, label }: { icon: any, val: string, label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="w-5 h-5 text-muted-foreground/50" />
      <div className="text-xl font-black">{val}</div>
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
    </div>
  )
}
