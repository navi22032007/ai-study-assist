# StudyAI -- AI-Powered Study Assistant

> Full-stack web application built for the **SYNERGY Club Full Stack & AI Project Challenge**
> Powered by **Google Gemini API** | **FastAPI** | **React 18** | **MongoDB** | **Firebase** | **Socket.IO**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Real-Time Events (Socket.IO)](#real-time-events-socketio)
- [Sample API Requests](#sample-api-requests)
- [Common Issues](#common-issues)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Features

### Core AI Features
| Feature | Description |
|---|---|
| **AI Summary** | Grounded summaries (max 200 words) via Gemini |
| **Key Points** | JSON-structured key concepts with importance levels (High / Medium / Low) |
| **Flashcards** | Auto-generated front/back flashcards with flip animation |
| **Mind Map** | Interactive visual concept map with React Flow |
| **Document Chat** | Grounded Q&A -- answers strictly from your document |
| **ELI5 Mode** | "Explain Like I'm 5" simplification |
| **Translation** | Translate summaries and key points to 10+ languages |
| **AI Vision Diagrams** | Automatic extraction and analysis of diagrams/charts from PDFs using Gemini Vision |

### Quiz Engine
| Feature | Description |
|---|---|
| **Quiz Generation** | MCQ, True/False, and Fill-in-the-blank with configurable difficulty |
| **Quiz Timer** | 1--60 min countdown with color-coded timer bar |
| **Submit-Once** | Quizzes lock after first submission; regenerate for new questions |
| **Score History** | Area chart of quiz performance over time |
| **Weak Topic Detection** | Auto-detects topics where you score below 60% |
| **CSV Export** | Export quiz questions as CSV |

### Certificates
| Feature | Description |
|---|---|
| **Auto-Issue** | Certificates awarded automatically when quiz score >= 80% |
| **Public Verification** | Shareable verification links with QR code |
| **PDF Download** | Download certificates as PDF with html2canvas + jsPDF |

### Live Study Rooms (Real-Time Collaboration)
| Feature | Description |
|---|---|
| **Mind Map Mode** | Collaboratively build and expand mind maps in real time |
| **Quiz Battle Mode** | Host launches questions; participants compete with a live leaderboard |
| **Discussion Mode** | Chat with document anchoring (e.g., "Page 2, Para 3") |
| **Room Management** | Host controls, participant list, auto-cleanup on empty |

#### Security & Hardening
| Feature | Description |
|---|---|
| **JWT Socket Auth** | Real-time rooms require JWT authentication for connection handshake |
| **Magic Byte Verification** | Server-side binary header inspection for all file uploads (protects against renamed malicious files) |
| **Security Headers** | Explicit CSP (Content Security Policy), HSTS, XSS protection, and anti-sniffing headers |
| **BRAM (Input Sanitization)** | Integrated DOMPurify to sanitize AI-generated content and chat messages |
| **IDOR Protection** | Strict document ownership checks on all API endpoints |

### Platform
| Feature | Description |
|---|---|
| **Google OAuth** | Firebase-backed authentication with JWT backend protection |
| **Document Upload** | Support for PDF, DOCX, PPTX, and TXT (50MB max), drag-and-drop, real-time progress bar |
| **Document Library** | Folder system, search, inline rename/delete |
| **Bookmarks** | Bookmark individual key points |
| **Share Links** | Public 7-day expiring share links |
| **Study Streak** | Daily login streak tracking |
| **Analytics Dashboard** | Score history, topic performance charts, study streaks, weak topics |
| **Onboarding Tutorial** | 6-step interactive guide for new users |
| **Rate Limiting** | 20 AI requests/hour per user |
| **Responsive** | Mobile, tablet, and desktop optimized |

---

## Tech Stack

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** (Premium Cream & Sage design system)
- **Radix UI** + **shadcn/ui** (Accessible primitives)
- **Framer Motion** (Glassmorphism effects, page transitions)
- **React Flow** (Interactive mind maps)
- **Recharts** (Visual analytics)
- **Socket.IO Client** (Authenticated WebSocket connections)
- **Zustand** (Auth & theme state management)
- **DOMPurify** (Content sanitization for AI output)
- **Firebase SDK** (Google OAuth client-side)

### Backend
- **Python 3.11+** + **FastAPI**
- **MongoDB** (Motor async driver)
- **Firebase Admin SDK** (Auth verification + Storage)
- **PyMuPDF** + **python-docx** + **python-pptx** (Multi-format text extraction)
- **Google Generative AI SDK** (Gemini 1.5 Flash -- Text & Vision)
- **python-socketio** (Real-time events with JWT verification)
- **PyJWT** (Secure token handling)
- **SlowAPI** (Rate limiting per user)
- **isomorphic-dompurify** (Backend sanitization capability)

---

## Project Structure

```
ai-study-assist/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, Socket.IO mount
│   ├── database.py                # MongoDB connection & indexes
│   ├── sockets.py                 # Socket.IO event handlers (study rooms)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.py                # POST /auth/verify, GET /auth/me
│   │   ├── documents.py           # Upload, list, get, delete, update, diagram extraction
│   │   ├── ai_features.py         # Summary, key-points, flashcards, chat, ELI5, translate, mind-map, diagrams
│   │   ├── quiz.py                # Generate, get, submit, history
│   │   ├── analytics.py           # Dashboard stats
│   │   ├── share.py               # Create/revoke share links, public view
│   │   └── certificates.py        # User certificates, public verification
│   ├── services/
│   │   ├── gemini_service.py      # All Gemini AI calls (text + vision) with retry logic
│   │   ├── firebase_service.py    # Auth verification + Storage
│   │   └── file_service.py        # PDF/TXT extraction + image extraction + validation
│   ├── schemas/
│   │   └── schemas.py             # All Pydantic models
│   └── middleware/
│       ├── auth_middleware.py      # JWT auth middleware
│       └── rate_limiter.py        # 20 AI req/hour limiter (SlowAPI)
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
│       ├── App.tsx                 # Router + Firebase auth listener
│       ├── index.css               # Global styles + design tokens
│       ├── lib/
│       │   ├── firebase.ts         # Firebase init + Google sign-in
│       │   ├── api.ts              # Axios client + all API functions
│       │   └── utils.ts            # Utility functions
│       ├── store/
│       │   └── authStore.ts        # Zustand auth store (persisted)
│       ├── types/
│       │   └── index.ts            # TypeScript interfaces
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx         # Sidebar nav + mobile menu
│       │   │   ├── OnboardingTutorial.tsx # 6-step interactive guide
│       │   │   └── ProtectedRoute.tsx
│       │   └── ui/                  # Reusable UI components
│       │       ├── bento-grid.tsx
│       │       ├── spotlight-card.tsx
│       │       ├── liquid-glass-button.tsx
│       │       ├── animated-group.tsx
│       │       ├── background-paths.tsx
│       │       └── ... (Radix UI primitives)
│       └── pages/
│           ├── LandingPage.tsx
│           ├── LoginPage.tsx
│           ├── DashboardPage.tsx
│           ├── UploadPage.tsx
│           ├── StudyViewPage.tsx         # Summary, Key Points, Flashcards, Mind Map, Chat, Diagrams, ELI5, Translation
│           ├── QuizPage.tsx
│           ├── QuizResultPage.tsx
│           ├── LibraryPage.tsx
│           ├── AnalyticsPage.tsx
│           ├── ProfilePage.tsx
│           ├── SharedDocumentPage.tsx
│           ├── LiveStudyRoomPage.tsx     # Real-time collaborative study rooms
│           └── PublicCertificatePage.tsx # Certificate verification + PDF download
│
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| MongoDB | 7.0+ | Local or [Atlas](https://cloud.mongodb.com) |
| Firebase project | -- | Free tier works |
| Gemini API key | -- | [Google AI Studio](https://aistudio.google.com/app/apikey) |

---

## Setup Instructions

### Step 1 -- Clone the project

```bash
git clone https://github.com/yourname/ai-study-assistant.git
cd ai-study-assistant
```

---

### Step 2 -- Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Authentication** > Sign-in method > **Google**
3. Add a **Web App** and copy the config values
4. Enable **Storage** and set rules to allow authenticated users:
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
5. Go to **Project Settings > Service accounts** > Generate new private key > save as `backend/firebase-credentials.json`

---

### Step 3 -- Backend Setup

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

### Step 4 -- Frontend Setup

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

## Running the App

### Option A -- Manual (Recommended for Development)

**Terminal 1 -- MongoDB** (skip if using Atlas):
```bash
mongod --dbpath /usr/local/var/mongodb
```

**Terminal 2 -- Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 3 -- Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

### Option B -- Docker Compose

```bash
# Build and start all services
docker compose up --build

# Stop
docker compose down
```

Access at **http://localhost:5173**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URL` | Yes | MongoDB connection string |
| `MONGODB_DB` | Yes | Database name |
| `JWT_SECRET` | Yes | Secret key for JWT signing (min 32 chars) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `FIREBASE_CREDENTIALS_PATH` | Yes* | Path to Firebase service account JSON |
| `FIREBASE_CREDENTIALS_JSON` | Yes* | Or inline JSON string (for deployment) |
| `FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket name |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `FRONTEND_URL` | Yes | Base URL for share links and certificates |

*Either `FIREBASE_CREDENTIALS_PATH` or `FIREBASE_CREDENTIALS_JSON` is required.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_API_URL` | Yes | API base URL (`/api` for dev proxy) |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/verify` | Verify Firebase token, return JWT |
| `GET` | `/api/auth/me` | Get current user info |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload PDF/TXT (multipart/form-data) with automatic diagram extraction |
| `GET` | `/api/documents/` | List user documents (filterable by folder, searchable) |
| `GET` | `/api/documents/folders` | List user folders |
| `GET` | `/api/documents/{id}` | Get document details |
| `PATCH` | `/api/documents/{id}` | Update title/folder |
| `DELETE` | `/api/documents/{id}` | Delete document and related quizzes |
| `POST` | `/api/documents/{id}/bookmark-keypoint` | Toggle key point bookmark |
| `GET` | `/api/documents/{id}/export/csv` | Export quiz as CSV |

### AI Features
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/summary` | Generate a max 200-word summary |
| `POST` | `/api/ai/key-points` | Extract key points with importance levels |
| `POST` | `/api/ai/flashcards` | Generate flashcards (configurable count) |
| `POST` | `/api/ai/eli5` | ELI5 explanation |
| `POST` | `/api/ai/translate` | Translate summary/key-points to target language |
| `POST` | `/api/ai/chat` | Chat with document (grounded conversation with history) |
| `POST` | `/api/ai/mind-map` | Generate mind map nodes and edges |
| `POST` | `/api/ai/analyze-diagrams` | On-demand diagram analysis via Gemini Vision |

### Quiz
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/quiz/generate` | Generate quiz (MCQ, true/false, fill-blank; easy/medium/hard) |
| `GET` | `/api/quiz/{id}` | Get quiz (answers hidden if unattempted) |
| `POST` | `/api/quiz/submit` | Submit answers and get scored result with explanations |
| `GET` | `/api/quiz/attempt/{id}` | Get attempt result with per-question explanations |
| `GET` | `/api/quiz/history/all` | Full quiz history |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/dashboard` | Dashboard stats (scores, streaks, weak topics, topic performance) |

### Sharing
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/share/create` | Create 7-day share link |
| `GET` | `/api/share/public/{token}` | Get shared document (no auth required) |
| `DELETE` | `/api/share/{document_id}` | Revoke share link |

### Certificates
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/certificates/me` | Get current user's certificates |
| `GET` | `/api/certificates/public/{token}` | Verify a certificate (no auth, QR-scannable) |

---

## Real-Time Events (Socket.IO)

Study rooms use Socket.IO for real-time collaboration. Connect to the `/ws` namespace.

### Client Events (emit)
| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ room_id, user_name, document_id? }` | Join a study room |
| `change_mode` | `{ room_id, mode }` | Switch mode: `mindmap`, `quiz`, `discussion` (host only) |
| `sync_mindmap` | `{ room_id, nodes, edges }` | Broadcast mind map updates |
| `quiz_question` | `{ room_id, question }` | Host broadcasts a new question |
| `submit_answer` | `{ room_id, question_id, answer, is_correct }` | Submit answer (+10 points if correct) |
| `send_chat` | `{ room_id, message, anchor? }` | Send chat message with optional document anchor |

### Server Events (listen)
| Event | Payload | Description |
|---|---|---|
| `participants_update` | `[{ sid, name, is_host }]` | Updated participant list |
| `mode_changed` | `{ mode }` | Room mode changed |
| `mindmap_updated` | `{ nodes, edges }` | Mind map state synced |
| `new_question` | `{ question }` | New quiz question from host |
| `leaderboard_update` | `{ name: score }` | Updated scores |
| `new_chat` | `{ sender, message, anchor?, timestamp }` | Incoming chat message |

---

## Sample API Requests

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
  "diagrams": [],
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
  "summary": "Newton's laws of motion form the foundation of classical mechanics...",
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

## Database Collections

| Collection | Key Fields |
|---|---|
| **users** | uid, email, display_name, photo_url, study_streak, last_study_date |
| **documents** | user_id, title, file_url, document_text, summary, diagrams, key_points, flashcards, mind_map, share_token |
| **quizzes** | user_id, document_id, questions, difficulty, attempted |
| **quiz_attempts** | user_id, quiz_id, score, question_results, weak_topics, time_taken_seconds |
| **certificates** | user_id, user_name, document_id, topic, score, token |

---

## Common Issues

| Problem | Solution |
|---|---|
| Firebase token invalid | Ensure `FIREBASE_CREDENTIALS_PATH` points to the correct service account JSON |
| Gemini rate limit | The free tier allows 15 req/min; the built-in rate limit is 20/hour per user |
| PDF text not extracted | Ensure the PDF is not scanned-only (image-based); PyMuPDF requires text layers |
| CORS errors | Check `ALLOWED_ORIGINS` includes your frontend URL exactly |
| MongoDB connection refused | Ensure MongoDB is running on port 27017 |
| Storage upload fails | Verify Firebase Storage rules allow writes for authenticated users |
| Socket.IO not connecting | Check that the backend mounts the Socket.IO ASGI app alongside FastAPI |
| Certificate not issued | Certificates auto-generate only when quiz score is 80% or above |

---

## License

MIT -- Built for educational purposes as part of the SYNERGY Full Stack & AI Challenge.

---

## Acknowledgements

- [Google Gemini API](https://ai.google.dev/)
- [Firebase](https://firebase.google.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React Flow](https://reactflow.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)
- [Socket.IO](https://socket.io/)
- [Radix UI](https://www.radix-ui.com/)
- [Framer Motion](https://www.framer.com/motion/)
