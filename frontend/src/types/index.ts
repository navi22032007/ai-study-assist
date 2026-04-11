export interface Document {
  id: string
  user_id: string
  title: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  folder: string
  summary?: string
  key_points?: KeyPoint[]
  flashcards?: Flashcard[]
  mind_map?: MindMap
  share_token?: string
  share_expires_at?: string
  created_at: string
  updated_at: string
}

export interface KeyPoint {
  point: string
  importance_level: 'high' | 'medium' | 'low'
  topic?: string
  bookmarked?: boolean
}

export interface Flashcard {
  front: string
  back: string
  topic: string
}

export interface MindMap {
  nodes: MindMapNode[]
  edges: MindMapEdge[]
}

export interface MindMapNode {
  id: string
  label: string
  type: 'root' | 'topic' | 'subtopic'
}

export interface MindMapEdge {
  id: string
  source: string
  target: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'mcq' | 'true_false' | 'fill_blank'
  options?: string[]
  correct_answer?: string
  explanation?: string
  topic: string
}

export interface Quiz {
  id: string
  document_id: string
  document_title: string
  questions: QuizQuestion[]
  difficulty: 'easy' | 'medium' | 'hard'
  time_limit_minutes: number
  attempted: boolean
  created_at: string
}

export interface QuizAnswer {
  question_id: string
  answer: string
}

export interface QuizResultQuestion {
  question_id: string
  question: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  explanation: string
  topic: string
}

export interface QuizResult {
  id: string
  quiz_id: string
  document_id: string
  score: number
  total_questions: number
  correct_answers: number
  time_taken_seconds: number
  question_results: QuizResultQuestion[]
  weak_topics: string[]
  difficulty: string
  document_title: string
  created_at: string
}

export interface AnalyticsDashboard {
  total_documents: number
  total_quizzes: number
  average_score: number
  best_score: number
  study_streak: number
  weak_topics: string[]
  score_history: Array<{
    date: string
    score: number
    document_title: string
    difficulty: string
  }>
  topic_performance: Array<{
    topic: string
    accuracy: number
    total_questions: number
    correct: number
  }>
  recent_activity: Array<{
    type: string
    document_title: string
    score: number
    date: string
  }>
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
