import { useState, useEffect } from 'react'
import { 
  User, Mail, Flame, Trophy, BookOpen, BarChart3, LogOut, 
  Shield, Award, ChevronRight, Moon, Sun 
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { signOutUser } from '../lib/firebase'
import { useNavigate, Link } from 'react-router-dom'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { GlowCard } from '@/components/ui/spotlight-card'
import { getMyCertificates } from '../lib/api'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [certificates, setCertificates] = useState<any[]>([])
  const [theme, setTheme] = useState(localStorage.getItem('study_theme') || 'dark')

  useEffect(() => {
    getMyCertificates().then(res => setCertificates(res.data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('study_theme', theme)
  }, [theme])

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOutUser()
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <AnimatedGroup preset="blur-slide" className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="page-title gradient-text">Profile</h1>
        <p className="text-muted-foreground mt-1">Your account information and earned credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-1">
          {/* Avatar + info */}
          <GlowCard>
            <div className="glass-card p-8 text-center bg-muted/10">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="avatar" className="w-24 h-24 rounded-full ring-4 ring-border mx-auto mb-4" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-amber-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
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

          {/* Settings */}
          <GlowCard>
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                 App Settings
              </h3>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span className="text-sm font-medium">Theme Mode</span>
                </div>
                <button 
                  onClick={toggleTheme}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus:outline-none ring-1 ring-border"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6 bg-emerald-500' : 'translate-x-1 bg-amber-500'}`} />
                </button>
              </div>
            </div>
          </GlowCard>

          {/* Account details */}
          <GlowCard>
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" /> Account Details
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
        </div>

        {/* Certificate Wall */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border/50 pb-2 w-full">
              <Award className="w-5 h-5 text-yellow-400" /> Certificate Wall
            </h2>
          </div>
          
          {certificates.length === 0 ? (
            <div className="p-10 border border-dashed border-border/50 rounded-2xl text-center text-muted-foreground">
              <Award className="w-12 h-12 opacity-20 mx-auto mb-3" />
              <p>You haven't earned any certificates yet.</p>
              <p className="text-sm mt-1">Score 80% or higher on quizzes to earn verifiable credentials.</p>
              <Link to="/library" className="btn-secondary mt-4 inline-flex">Go to Library</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map(cert => (
                <GlowCard key={cert.id}>
                  <div className="glass-card p-5 relative overflow-hidden group">
                     {/* Graphic background */}
                     <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all duration-300 pointer-events-none" />
                     <Award className="absolute right-3 top-3 w-16 h-16 text-yellow-500/10 -rotate-12 pointer-events-none" />
                     
                     <div className="relative z-10">
                       <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-1 block">Mastery Achieved</span>
                       <h3 className="font-bold text-foreground text-lg mb-1 leading-tight line-clamp-2" title={cert.topic}>
                         {cert.topic}
                       </h3>
                       <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                         <span>Score: {cert.score}%</span>
                         <span>•</span>
                         <span>{new Date(cert.created_at).toLocaleDateString()}</span>
                       </div>
                       
                       <Link to={`/certificate/${cert.token}`} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group-hover:gap-2 transition-all">
                         View Credential <ChevronRight className="w-3 h-3" />
                       </Link>
                     </div>
                  </div>
                </GlowCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </AnimatedGroup>
  )
}
