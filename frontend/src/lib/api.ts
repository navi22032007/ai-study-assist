import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────
export const verifyFirebaseToken = (firebase_token: string) =>
  api.post('/auth/verify', { firebase_token })

export const getMe = () => api.get('/auth/me')
export const reportViolation = () => api.post('/auth/violation')

// ── Documents ─────────────────────────────────────────
export const uploadDocument = (formData: FormData, onProgress?: (pct: number) => void) =>
  api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })

export const listDocuments = (params?: { folder?: string; search?: string }) =>
  api.get('/documents/', { params })

export const getDocument = (id: string) => api.get(`/documents/${id}`)

export const deleteDocument = (id: string) => api.delete(`/documents/${id}`)

export const updateDocument = (id: string, data: { title?: string; folder?: string }) =>
  api.patch(`/documents/${id}`, data)

export const getFolders = () => api.get('/documents/folders')

export const toggleBookmark = (docId: string, index: number, bookmarked: boolean) =>
  api.post(`/documents/${docId}/bookmark-keypoint`, { index, bookmarked })

export const exportQuizCSV = (docId: string) =>
  api.get(`/documents/${docId}/export/csv`, { responseType: 'blob' })

// ── AI Features ───────────────────────────────────────
export const generateSummary = (document_id: string) =>
  api.post('/ai/summary', { document_id })

export const generateKeyPoints = (document_id: string) =>
  api.post('/ai/key-points', { document_id })

export const generateFlashcards = (document_id: string, count = 10) =>
  api.post('/ai/flashcards', { document_id, count })

export const generateELI5 = (document_id: string, topic?: string) =>
  api.post('/ai/eli5', { document_id, topic })

export const translateContent = (document_id: string, target_language: string, content_type = 'summary') =>
  api.post('/ai/translate', { document_id, target_language, content_type })

export const chatWithDocument = (document_id: string, message: string, history: Array<{ role: string; content: string }>) =>
  api.post('/ai/chat', { document_id, message, history })

export const generateMindMap = (document_id: string) =>
  api.post('/ai/mind-map', { document_id })

// ── Quiz ──────────────────────────────────────────────
export const generateQuiz = (data: {
  document_id: string
  count?: number
  difficulty?: string
  question_types?: string[]
}) => api.post('/quiz/generate', data)

export const getQuiz = (quiz_id: string) => api.get(`/quiz/${quiz_id}`)

export const submitQuiz = (data: {
  quiz_id: string
  answers: Array<{ question_id: string; answer: string }>
  time_taken_seconds: number
}) => api.post('/quiz/submit', data)

export const getQuizAttempt = (attempt_id: string) => api.get(`/quiz/attempt/${attempt_id}`)

export const getQuizHistory = () => api.get('/quiz/history/all')

// ── Analytics ─────────────────────────────────────────
export const getDashboardAnalytics = () => api.get('/analytics/dashboard')

// ── Share ─────────────────────────────────────────────
export const createShareLink = (document_id: string) =>
  api.post('/share/create', { document_id })

export const getSharedDocument = (token: string) =>
  api.get(`/share/public/${token}`)

export const revokeShareLink = (document_id: string) =>
  api.delete(`/share/${document_id}`)

// ── Certificates ──────────────────────────────────────
export const getMyCertificates = () =>
  api.get('/certificates/me')

export const verifyPublicCertificate = (token: string) =>
  api.get(`/certificates/public/${token}`)

// ── AI Vision ─────────────────────────────────────────
export const analyzeDiagrams = (document_id: string) =>
  api.post('/ai/analyze-diagrams', { document_id })
