import { useState } from 'react'
import { User, Mail, Flame, Trophy, BookOpen, BarChart3, LogOut, Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { signOutUser } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { GlowCard } from '@/components/ui/spotlight-card'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOutUser()
    logout()
    navigate('/login')
  }

  return (
    <AnimatedGroup preset="blur-slide" className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title gradient-text">Profile</h1>
        <p className="text-muted-foreground mt-1">Your account information</p>
      </div>

      {/* Avatar + info */}
      <GlowCard>
        <div className="glass-card p-8 text-center">
          {user?.photo_url ? (
            <img src={user.photo_url} alt="avatar" className="w-24 h-24 rounded-full ring-4 ring-border mx-auto mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              {user?.display_name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
          )}
          <h2 className="text-xl font-bold text-foreground">{user?.display_name || 'Learner'}</h2>
          <p className="text-muted-foreground text-sm mt-1 flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </p>

          {user?.study_streak !== undefined && user.study_streak > 0 && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
              <Flame className="w-4 h-4" />
              {user.study_streak} day study streak!
            </div>
          )}
        </div>
      </GlowCard>

      {/* Account details */}
      <GlowCard>
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Account Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Display Name</p>
                <p className="text-sm font-medium">{user?.display_name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Auth Method</p>
                <p className="text-sm font-medium">Google OAuth</p>
              </div>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Sign out */}
      <div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-semibold text-sm hover:bg-destructive/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </AnimatedGroup>
  )
}
