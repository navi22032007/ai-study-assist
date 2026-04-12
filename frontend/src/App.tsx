import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LiquidCursor } from './components/ui/liquid-cursor'
import { onAuthStateChanged } from './lib/firebase'
import { verifyFirebaseToken } from './lib/api'
import { useAuthStore } from './store/authStore'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import StudyViewPage from './pages/StudyViewPage'
import QuizPage from './pages/QuizPage'
import QuizResultPage from './pages/QuizResultPage'
import LibraryPage from './pages/LibraryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProfilePage from './pages/ProfilePage'
import SharedDocumentPage from './pages/SharedDocumentPage'
import LiveStudyRoomPage from './pages/LiveStudyRoomPage'
import PublicCertificatePage from './pages/PublicCertificatePage'

// Layout
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'

function App() {
  const { setUser, setToken, logout } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          const response = await verifyFirebaseToken(idToken)
          const { user, access_token } = response.data
          setUser(user)
          setToken(access_token)
        } catch (err) {
          console.error('Auth error:', err)
          logout()
        }
      } else {
        logout()
      }
    })
    return () => unsub()
  }, [])

  return (
    <BrowserRouter>
      <LiquidCursor size={44} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/shared/:token" element={<SharedDocumentPage />} />
        <Route path="/room/:roomId" element={<LiveStudyRoomPage />} />
        <Route path="/certificate/:token" element={<PublicCertificatePage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/study/:documentId" element={<StudyViewPage />} />
            <Route path="/quiz/:quizId" element={<QuizPage />} />
            <Route path="/result/:attemptId" element={<QuizResultPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
