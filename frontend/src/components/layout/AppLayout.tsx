import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  LayoutDashboard, Upload, BarChart3, Library, User, Users,
  LogOut, Menu, X, GraduationCap, Flame, ChevronRight,
  Focus, Zap
} from 'lucide-react'
import { signOutUser } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { AnimatedGroup } from '@/components/ui/animated-group'
import OnboardingTutorial from './OnboardingTutorial'
import { FocusMode } from '@/components/ui/focus-mode'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/live-rooms', icon: Users, label: 'Live Rooms' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [focusModeActive, setFocusModeActive] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await signOutUser()
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:relative inset-y-0 left-0 z-30 flex flex-col w-64 border-r border-border/50 bg-card/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm">StudyAI</h1>
            <p className="text-xs text-muted-foreground">Assistant</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'nav-link-active group' : 'nav-link group'
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User & Streak & XP */}
        <div className="p-3 border-t border-border/50 space-y-2">
          <div className="flex gap-2">
            {user?.study_streak !== undefined && user.study_streak > 0 && (
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-bold whitespace-nowrap">{user.study_streak} Days</span>
              </div>
            )}
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-primary font-bold whitespace-nowrap">{user?.xp_points ?? 0} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="avatar" className="w-8 h-8 rounded-full ring-2 ring-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.display_name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.display_name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/60 backdrop-blur-xl">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-amber-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">StudyAI</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatedGroup
            key={location.pathname}
            variants={{
              container: {
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08,
                    delayChildren: 0.1,
                  },
                },
              },
              item: {
                hidden: {
                  opacity: 0,
                  filter: 'blur(12px)',
                  y: 12,
                },
                visible: {
                  opacity: 1,
                  filter: 'blur(0px)',
                  y: 0,
                  transition: {
                    type: 'spring',
                    bounce: 0.3,
                    duration: 1.5,
                  },
                },
              },
            }}
            className="h-full"
          >
            <Outlet />
          </AnimatedGroup>
        </main>
      </div>
      <OnboardingTutorial />

      {/* Focus Mode Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setFocusModeActive(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/20 flex items-center justify-center z-40 border-4 border-background"
        title="Enter Focus Mode"
      >
        <Focus className="w-7 h-7" />
      </motion.button>

      <AnimatePresence>
        {focusModeActive && (
          <FocusMode onClose={() => setFocusModeActive(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
