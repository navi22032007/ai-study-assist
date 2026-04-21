from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class ImportanceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# Document schemas
class DocumentCreate(BaseModel):
    title: str
    folder: Optional[str] = "Default"

class KeyPoint(BaseModel):
    point: str
    importance_level: ImportanceLevel
    bookmarked: bool = False

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    title: str
    filename: str
    file_url: str
    file_size: int
    file_type: str
    folder: str
    summary: Optional[str] = None
    key_points: Optional[List[KeyPoint]] = None
    created_at: datetime
    updated_at: datetime
    share_token: Optional[str] = None
    share_expires_at: Optional[datetime] = None

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int

# AI Feature schemas
class SummaryRequest(BaseModel):
    document_id: str

class SummaryResponse(BaseModel):
    document_id: str
    summary: str
    word_count: int

class KeyPointsRequest(BaseModel):
    document_id: str

class KeyPointsResponse(BaseModel):
    document_id: str
    key_points: List[KeyPoint]

class FlashcardItem(BaseModel):
    front: str
    back: str
    topic: str

class FlashcardsRequest(BaseModel):
    document_id: str
    count: Optional[int] = 10

class FlashcardsResponse(BaseModel):
    document_id: str
    flashcards: List[FlashcardItem]

class ELI5Request(BaseModel):
    document_id: str
    topic: Optional[str] = None

class ELI5Response(BaseModel):
    document_id: str
    explanation: str

class TranslationRequest(BaseModel):
    document_id: str
    target_language: str
    content_type: str = "summary"  # summary | key_points

class TranslationResponse(BaseModel):
    document_id: str
    translated_content: Any
    target_language: str

class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str

class ChatRequest(BaseModel):
    document_id: str
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    document_id: str
    response: str
    grounded: bool = True

class MindMapNode(BaseModel):
    id: str
    label: str
    type: str  # root | topic | subtopic
    parent: Optional[str] = None

class MindMapRequest(BaseModel):
    document_id: str

class MindMapResponse(BaseModel):
    document_id: str
    nodes: List[dict]
    edges: List[dict]

# Quiz schemas
class QuizQuestion(BaseModel):
    id: str
    question: str
    type: QuestionType
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    topic: str

class QuizGenerateRequest(BaseModel):
    document_id: str
    count: Optional[int] = 10
    difficulty: Optional[DifficultyLevel] = DifficultyLevel.MEDIUM
    question_types: Optional[List[QuestionType]] = None

class QuizResponse(BaseModel):
    id: str
    document_id: str
    questions: List[QuizQuestion]
    difficulty: DifficultyLevel
    time_limit_minutes: int
    created_at: datetime

class QuizAnswer(BaseModel):
    question_id: str
    answer: str

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: List[QuizAnswer]
    time_taken_seconds: int

class QuizResultQuestion(BaseModel):
    question_id: str
    question: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str
    topic: str

class QuizResult(BaseModel):
    id: str
    quiz_id: str
    document_id: str
    user_id: str
    score: float
    total_questions: int
    correct_answers: int
    time_taken_seconds: int
    question_results: List[QuizResultQuestion]
    weak_topics: List[str]
    created_at: datetime

# Analytics schemas
class AnalyticsSummary(BaseModel):
    total_documents: int
    total_quizzes: int
    average_score: float
    study_streak: int
    best_score: float
    weak_topics: List[str]
    score_history: List[dict]
    topic_performance: List[dict]

# Share schemas
class ShareRequest(BaseModel):
    document_id: str

class ShareResponse(BaseModel):
    share_token: str
    share_url: str
    expires_at: datetime

# Auth schemas
class TokenVerifyRequest(BaseModel):
    firebase_token: str

class UserInfo(BaseModel):
    uid: str
    email: Optional[str] = ""
    display_name: Optional[str] = ""
    photo_url: Optional[str] = ""
    xp_points: Optional[int] = 0
    study_streak: Optional[int] = 0

class AuthResponse(BaseModel):
    user: UserInfo
    access_token: str
