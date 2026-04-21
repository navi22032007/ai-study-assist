# Product Requirements Document (PRD): StudyAI 🎓

## 1. Executive Summary
**StudyAI** is an advanced, AI-powered study assistant designed to transform static educational documents (PDF, DOCX, PPTX, TXT) into interactive, collaborative learning experiences. By leveraging the **Google Gemini Pro** large language model, StudyAI automates time-consuming tasks like summarizing, flashcard creation, and quiz generation, while providing a real-time collaborative environment for students to learn together.

---

## 2. Product Objectives
- **Efficiency:** Reduce the time students spend manually creating study materials (notes, flashcards).
- **Engagement:** Gamify learning through Quiz Battles and Study Streaks.
- **Collaboration:** Enable synchronized group study sessions through real-time "Live Study Rooms."
- **Verification:** Provide credible, blockchain-inspired verified certificates for academic achievements.

---

## 3. Technology Stack: The "Small Things" Breakdown

### 3.1 Frontend (The Presentation Layer)
The frontend is built for speed, responsiveness, and premium aesthetics.

| Technology | Implementation Detail | Purpose |
| :--- | :--- | :--- |
| **Vite** | Build Tooling | Provides ultra-fast Hot Module Replacement (HMR) and optimized build bundling. |
| **React 18** | UI Framework | Used for managing the component-based architecture and state-driven UI updates. |
| **TypeScript** | Scripting Language| Ensures type safety, reducing runtime errors and improving developer productivity. |
| **Tailwind CSS** | Styling Engine | A utility-first CSS framework used to build our custom "Premium Cream & Sage" design system. |
| **Framer Motion** | Animation Library | Powers all micro-interactions: card flips, page transitions, and the "Glassmorphism" hover effects. |
| **Radix UI** | Accessible Components | Provides the unstyled primitives for accessible dialogs, tooltips, and dropdowns. |
| **React Flow** | Diagramming | Powers the interactive **Mind Map** feature, allowing users to drag and zoom concept nodes. |
| **Recharts** | Data Visualization | Used for the **Analytics Dashboard** to render score history and topic performance charts. |
| **Zustand** | State Management | A lightweight alternative to Redux, used for persistent authentication and theme states. |
| **Socket.IO Client** | Real-time Sync | Establishes the WebSocket connection for Live Rooms, synchronized with JWT headers. |
| **DOMPurify** | Security/XSS | Sanitizes AI-generated Markdown to prevent malicious script injection in the UI. |
| **html2canvas / jsPDF**| Document Export | Captures the HTML certificate element and converts it into a downloadable PDF file. |

### 3.2 Backend (The Intelligence Layer)
The backend is a high-performance Python ecosystem designed for AI orchestration and secure data handling.

| Technology | Implementation Detail | Purpose |
| :--- | :--- | :--- |
| **FastAPI** | Web Framework | An asynchronous, high-speed Python framework with automatic OpenAPI (Swagger) documentation. |
| **Uvicorn** | Web Server | An ASGI server implementation for Python, capable of handling high concurrency. |
| **Google Gemini API**| AI Engine (LLM) | Specifically **Gemini 1.5 Flash**. Handles Text Analysis, ELI5, and Vision (Diagram Extraction). |
| **Motor (Async IOMotor)**| Database Driver| An asynchronous MongoDB driver that doesn't block the execution loop during I/O. |
| **Socket.IO (Server)** | Collaborative Engine | Manages real-time event broadcasting for Quiz Battles and Mind Map synchronization. |
| **Firebase Admin SDK**| Auth & Storage | Verifies Google IDs, handles JWT generation, and manages blob storage for user documents. |
| **PyMuPDF (fitz)** | PDF Processing | High-performance library for extracting text and rendering pages as images for AI analysis. |
| **python-docx / pptx**| Document Parsing | Specialized libraries to extract text structures from Word and PowerPoint files. |
| **PyJWT** | Token Security | Used to sign and verify secure session tokens with HS256 algorithms. |
| **SlowAPI** | Traffic Control | Implements rate limiting (e.g., 20 AI requests/hour) to prevent API quota exploitation. |

### 3.3 Data Layer (Persistence)
- **MongoDB Atlas:** A NoSQL database chosen for its flexibility in storing complex, nested AI data (like Mind Map JSON structures).
- **Firebase Storage:** Used for storing the actual physical document files (PDFs/Office files) with user-specific isolation.

---

## 4. Key Functional Features

### 4.1 AI-Powered Analysis
- **Automatic Diagram Extraction:** Uses Gemini Vision to "look" at PDF charts and explain them verbally.
- **Context-Grounded Chat:** An AI chatbot that is "bound" to the document; it refuses to answer questions not related to the uploaded text.
- **Multilingual Support:** One-click translation of generated summaries into 10+ languages using AI-native linguistic models.

### 4.2 The Quiz & Certification Engine
- **Algorithmic Question Gen:** Generates MCQs, True/False, and Fill-in-the-blanks based on the most relevant key points.
- **Verification Logic:** Certificates are only issued if the score >= 80%. Each certificate contains a unique **UUID Token** and **QR Code** for public verification.

### 4.3 Social Learning (Live Rooms)
- **Host/Participant Loop:** The host controls the study mode (Mind Map, Quiz, or Chat).
- **Synchronized State:** Using `broadcast` events, every participant's screen updates instantly when the host moves a node or launches a quiz question.

---

## 5. Security Architecture (The Hardened Wall)
- **Magic Byte Verification:** The backend inspects the "fingerprint" of files (e.g., `%PDF-`) instead of trusting file extensions, preventing malicious script uploads.
- **Socket Handshake Auth:** WebSockets are protected by a mandatory JWT handshake. No unauthenticated user can join a socket namespace.
- **Content Security Policy (CSP):** Browser-level enforcement that blocks unauthorized scripts, styles, and "eval()" calls.
- **IDOR Protection:** Every document request is checked against the DB `user_id`; it is impossible for User A to see User B's file by guessing a URL.

---

## 6. Design & User Experience (UX)
- **Design System:** "Midnight Sage & Cream" — a high-contrast, premium aesthetic designed to reduce eye strain during long study sessions.
- **Micro-interactions:** Framer Motion is used for "spring-physics" animations, making the interface feel alive and premium.
- **Focus Mode:** A full-screen distraction-free interface with an integrated "XP Penalty" system to encourage students to stay on task.

---

## 7. Future Roadmap
1. **AI Voice Synthesis:** Convert summaries into audio podcasts for auditory learners.
2. **Global Leaderboard:** Rank students based on XP points earned through daily study streaks.
3. **Smart Folder Sharing:** Allow users to share entire folders rather than just single documents.
