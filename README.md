# 🎓 StudyAI — AI-Powered Study Assistant

> Full-stack web application built for the **SYNERGY Club Full Stack & AI Project Challenge**  
> Powered by **Google Gemini API** · **FastAPI** · **React 18** · **MongoDB** · **Firebase**

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Sample API Requests](#sample-api-requests)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Google OAuth** | Firebase-backed authentication with JWT backend protection |
| 📄 **Document Upload** | PDF & TXT upload (10MB max), drag & drop, progress bar, Firebase Storage |
| 🤖 **AI Summary** | ≤ 200-word grounded summaries via Gemini |
| 📌 **Key Points** | JSON-structured key concepts with importance levels (High/Med/Low) |
| 🃏 **Flashcards** | Auto-generated front/back flashcards with flip animation |
| 🧠 **Mind Map** | Interactive visual concept map with React Flow |
| 💬 **Document Chat** | Grounded Q&A — answers strictly from your document |
| 🧒 **ELI5 Mode** | "Explain Like I'm 5" simplification |
| 🌍 **Translation** | Translate summaries/key points to 10+ languages |
| ❓ **Quiz Engine** | MCQ, True/False, Fill-in-blank with configurable difficulty |
| ⏱️ **Quiz Timer** | 1–60 min countdown with color-coded timer bar |
| 🔒 **Submit-Once** | Quizzes lock after first submission; regenerate for new questions |
| 📊 **Score History** | Area chart of quiz performance over time |
| 🎯 **Weak Topic Detection** | Auto-detects topics where you score < 60% |
| 🔥 **Study Streak** | Daily login streak tracking |
| 📚 **Document Library** | Folder system, search, inline rename/delete |
| 🔖 **Bookmarks** | Bookmark individual key points |
| 🔗 **Share Links** | Public 7-day expiring share links |
| 📥 **CSV Export** | Export quiz questions as CSV |
| 📱 **Responsive** | Mobile, tablet, and desktop optimized |
| 🚦 **Rate Limiting** | 20 AI requests/hour per user |

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** (dark theme design system)
- **Framer Motion** (page transitions, card animations)
- **React Flow** (interactive mind maps)
- **Recharts** (score history, topic bar charts, result pie)
- **Zustand** (auth state management)
- **Axios** (API client with interceptors)
- **Firebase SDK** (Google OAuth)

### Backend
- **Python 3.11** + **FastAPI**
- **MongoDB** (Motor async driver)
- **Firebase Admin SDK** (token verification + Storage)
- **PyMuPDF** (PDF text extraction)
- **Google Generative AI SDK** (Gemini 1.5 Flash)
- **PyJWT** (JWT generation/verification)

---

## 📁 Project Structure

```
ai-study-assistant/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, middleware
│   ├── database.py              # MongoDB connection & indexes
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.py              # POST /auth/verify, GET /auth/me
│   │   ├── documents.py         # Upload, list, get, delete, update
│   │   ├── ai_features.py       # Summary, key-points, flashcards, chat, ELI5, translate, mind-map
│   │   ├── quiz.py              # Generate, get, submit, history
│   │   ├── analytics.py         # Dashboard stats
│   │   └── share.py             # Create/revoke share links, public view
│   ├── services/
│   │   ├── gemini_service.py    # All Gemini AI calls + JSON parsing
│   │   ├── firebase_service.py  # Auth verification + Storage
│   │   └── file_service.py      # PDF/TXT extraction + validation
│   ├── schemas/
│   │   └── schemas.py           # All Pydantic models
│   └── middleware/
│       ├── auth_middleware.py   # JWT auth middleware
│       └── rate_limiter.py      # 20 AI req/hour limiter
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── main.tsx
│       ├── App.tsx              # Router + Firebase auth listener
│       ├── index.css            # Global styles + design tokens
│       ├── lib/
│       │   ├── firebase.ts      # Firebase init + Google sign-in
│       │   └── api.ts           # Axios client + all API functions
│       ├── store/
│       │   └── authStore.ts     # Zustand auth store (persisted)
│       ├── types/
│       │   └── index.ts         # TypeScript interfaces
│       ├── components/
│       │   └── layout/
│       │       ├── AppLayout.tsx      # Sidebar nav + mobile menu
│       │       └── ProtectedRoute.tsx
│       └── pages/
│           ├── LandingPage.tsx
│           ├── LoginPage.tsx
│           ├── DashboardPage.tsx
│           ├── UploadPage.tsx
│           ├── StudyViewPage.tsx    # Summary, Key Points, Flashcards, Mind Map, Chat
│           ├── QuizPage.tsx
│           ├── QuizResultPage.tsx
│           ├── LibraryPage.tsx
│           ├── AnalyticsPage.tsx
│           ├── ProfilePage.tsx
│           └── SharedDocumentPage.tsx
│
├── docker-compose.yml
└── README.md
```

---

## 📦 Prerequisites

Make sure you have the following installed:

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| MongoDB | 7.0+ | Local or [Atlas](https://cloud.mongodb.com) |
| Firebase project | — | Free tier works |
| Gemini API key | — | [makersuite.google.com](https://makersuite.google.com/app/apikey) |

---

## 🔧 Setup Instructions

### Step 1 — Clone the project

```bash
git clone https://github.com/yourname/ai-study-assistant.git
cd ai-study-assistant
```

---

### Step 2 — Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a new project
2. Enable **Authentication** → Sign-in method → **Google**
3. Add a **Web App** → copy the config values
4. Enable **Storage** → set rules to allow authenticated users:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /documents/{userId}/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
5. Go to **Project Settings → Service accounts** → Generate new private key → save as `backend/firebase-credentials.json`

---

### Step 3 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
```

Edit `backend/.env`:
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=ai_study_assistant
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GEMINI_API_KEY=your-gemini-api-key
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

---

### Step 4 — Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_API_URL=/api
```

---

## 🚀 Running the App

### Option A — Manual (Recommended for Development)

**Terminal 1 — MongoDB** (skip if using Atlas):
```bash
mongod --dbpath /usr/local/var/mongodb
```

**Terminal 2 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

### Option B — Docker Compose

```bash
# Build and start all services
docker compose up --build

# Stop
docker compose down
```

Access at **http://localhost:5173**

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URL` | ✅ | MongoDB connection string |
| `MONGODB_DB` | ✅ | Database name |
| `JWT_SECRET` | ✅ | Secret key for JWT signing (min 32 chars) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `FIREBASE_CREDENTIALS_PATH` | ✅* | Path to Firebase service account JSON |
| `FIREBASE_CREDENTIALS_JSON` | ✅* | Or inline JSON string (for deployment) |
| `FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage bucket name |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins |
| `FRONTEND_URL` | ✅ | Base URL for share links |

*Either `FIREBASE_CREDENTIALS_PATH` or `FIREBASE_CREDENTIALS_JSON` is required.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `VITE_API_URL` | ✅ | API base URL (`/api` for dev proxy) |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/verify` | Verify Firebase token, return JWT |
| `GET` | `/api/auth/me` | Get current user info |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload PDF/TXT (multipart/form-data) |
| `GET` | `/api/documents/` | List user documents |
| `GET` | `/api/documents/{id}` | Get document details |
| `DELETE` | `/api/documents/{id}` | Delete document |
| `PATCH` | `/api/documents/{id}` | Update title/folder |
| `GET` | `/api/documents/folders` | List user folders |
| `POST` | `/api/documents/{id}/bookmark-keypoint` | Toggle key point bookmark |
| `GET` | `/api/documents/{id}/export/csv` | Export quiz as CSV |

### AI Features
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/summary` | Generate ≤200 word summary |
| `POST` | `/api/ai/key-points` | Extract key points JSON |
| `POST` | `/api/ai/flashcards` | Generate flashcards |
| `POST` | `/api/ai/eli5` | ELI5 explanation |
| `POST` | `/api/ai/translate` | Translate summary/key-points |
| `POST` | `/api/ai/chat` | Chat with document |
| `POST` | `/api/ai/mind-map` | Generate mind map nodes/edges |

### Quiz
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/quiz/generate` | Generate quiz questions |
| `GET` | `/api/quiz/{quiz_id}` | Get quiz (no answers if unattempted) |
| `POST` | `/api/quiz/submit` | Submit answers, get scored result |
| `GET` | `/api/quiz/attempt/{id}` | Get attempt result with explanations |
| `GET` | `/api/quiz/history/all` | Full quiz history |

### Analytics & Share
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/dashboard` | Full dashboard stats |
| `POST` | `/api/share/create` | Create 7-day share link |
| `GET` | `/api/share/public/{token}` | Public shared document view |
| `DELETE` | `/api/share/{document_id}` | Revoke share link |

---

## 📤 Sample API Requests & Responses

### 1. Verify Firebase Token
```http
POST /api/auth/verify
Content-Type: application/json

{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response:**
```json
{
  "user": {
    "uid": "abc123",
    "email": "student@example.com",
    "display_name": "Arjun S",
    "photo_url": "https://..."
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 2. Upload Document
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary PDF data]
title: "Physics Chapter 3"
folder: "Physics"
```

**Response:**
```json
{
  "id": "664a1b2c3d4e5f6a7b8c9d0e",
  "user_id": "abc123",
  "title": "Physics Chapter 3",
  "filename": "chapter3.pdf",
  "file_url": "https://storage.googleapis.com/...",
  "file_size": 245760,
  "file_type": "application/pdf",
  "folder": "Physics",
  "summary": null,
  "key_points": [],
  "created_at": "2026-04-10T10:30:00Z",
  "updated_at": "2026-04-10T10:30:00Z"
}
```

---

### 3. Generate Summary
```http
POST /api/ai/summary
Authorization: Bearer <token>
Content-Type: application/json

{
  "document_id": "664a1b2c3d4e5f6a7b8c9d0e"
}
```

**Response:**
```json
{
  "document_id": "664a1b2c3d4e5f6a7b8c9d0e",
  "summary": "Newton's laws of motion form the foundation of classical mechanics. The first law states that an object at rest remains at rest unless acted upon by an external force. The second law establishes that force equals mass times acceleration (F=ma), describing how velocity changes when a body is acted upon by external forces. The third law asserts that for every action there is an equal and opposite reaction. These principles govern the motion of objects ranging from everyday items to celestial bodies, and were groundbreaking when published in 1687 in Principia Mathematica. Applications include engineering, aerospace design, and understanding planetary orbits.",
  "word_count": 97
}
```

---

### 4. Generate Quiz
```http
POST /api/quiz/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "document_id": "664a1b2c3d4e5f6a7b8c9d0e",
  "count": 5,
  "difficulty": "medium",
  "question_types": ["mcq", "true_false"]
}
```

**Response:**
```json
{
  "id": "664b2c3d4e5f6a7b8c9d0e1f",
  "document_id": "664a1b2c3d4e5f6a7b8c9d0e",
  "questions": [
    {
      "id": "q1-uuid",
      "question": "What does Newton's second law of motion state?",
      "type": "mcq",
      "options": ["F = ma", "Objects stay at rest", "Every action has a reaction", "Energy is conserved"],
      "topic": "Newton's Laws"
    }
  ],
  "difficulty": "medium",
  "time_limit_minutes": 15,
  "attempted": false,
  "created_at": "2026-04-10T10:35:00Z"
}
```

---

### 5. Submit Quiz
```http
POST /api/quiz/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "quiz_id": "664b2c3d4e5f6a7b8c9d0e1f",
  "answers": [
    {"question_id": "q1-uuid", "answer": "F = ma"}
  ],
  "time_taken_seconds": 240
}
```

**Response:**
```json
{
  "id": "664c3d4e5f6a7b8c9d0e1f2a",
  "quiz_id": "664b2c3d4e5f6a7b8c9d0e1f",
  "score": 80.0,
  "total_questions": 5,
  "correct_answers": 4,
  "time_taken_seconds": 240,
  "weak_topics": ["Newton's Third Law"],
  "question_results": [
    {
      "question_id": "q1-uuid",
      "question": "What does Newton's second law state?",
      "user_answer": "F = ma",
      "correct_answer": "F = ma",
      "is_correct": true,
      "explanation": "Newton's second law F=ma describes how force, mass and acceleration relate.",
      "topic": "Newton's Laws"
    }
  ]
}
```

---

## 🚨 Common Issues

| Problem | Solution |
|---|---|
| Firebase token invalid | Ensure `FIREBASE_CREDENTIALS_PATH` points to the correct service account JSON |
| Gemini rate limit | The free tier allows 15 req/min; built-in rate limit is 20/hour per user |
| PDF text not extracted | Ensure the PDF is not scanned-only (image-based); PyMuPDF requires text layers |
| CORS errors | Check `ALLOWED_ORIGINS` includes your frontend URL exactly |
| MongoDB connection refused | Ensure MongoDB is running on port 27017 |
| Storage upload fails | Verify Firebase Storage rules allow writes for authenticated users |

---

## 📜 License

MIT — Built for educational purposes as part of the SYNERGY Full Stack & AI Challenge.

---

## 🙏 Acknowledgements

- [Google Gemini API](https://ai.google.dev/)
- [Firebase](https://firebase.google.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React Flow](https://reactflow.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)
