# User Setup & Environment Configuration Guide 🛠️

This guide provides a detailed, step-by-step walkthrough for configuring your environment variables and getting the **StudyAI** platform running on your local machine.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **MongoDB** (Local instance or MongoDB Atlas account)
- **Firebase Account** (Free tier is sufficient)
- **Google AI Studio Key** (For Gemini API)

---

## 🔐 Step 1: Firebase Configuration (Crucial)

Firebase handles your Authentication (Google Login) and Storage (Document Uploads).

1.  **Create a Project:** Go to [Firebase Console](https://console.firebase.google.com/) and click "Add Project".
2.  **Enable Authentication:**
    *   Navigate to **Build > Authentication**.
    *   Click "Get Started" and select **Google** as a sign-in provider. Enable it.
3.  **Enable Storage:**
    *   Navigate to **Build > Storage**.
    *   Click "Get Started" and choose "Start in test mode" (or apply the rules from the README).
4.  **Register Your Web App:**
    *   On the Project Overview page, click the `</>` icon to add a web app.
    *   Give it a nickname and click "Register app".
    *   **Keep these credentials handy!** You will need them for the Frontend `.env.local` file.
5.  **Generate Service Account Key:**
    *   Go to **Project Settings (Gear icon) > Service accounts**.
    *   Click "Generate new private key".
    *   Download the `.json` file, rename it to `firebase-credentials.json`, and place it in the `backend/` folder.

---

## 🐍 Step 2: Backend Configuration (`backend/.env`)

1.  Open a terminal and navigate to the backend folder: `cd backend`
2.  Create a new file named `.env` and copy the following template:

```env
# --- DATABASE CONFIG ---
# If using local MongoDB: mongodb://localhost:27017
# If using Atlas: mongodb+srv://<user>:<password>@cluster0...
MONGODB_URL=your_mongodb_connection_string
MONGODB_DB=ai_study_assistant

# --- SECURITY ---
# Run this in terminal to generate a random key: python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET=your_generated_random_secret_key

# --- AI CONFIG ---
# Get yours from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# --- FIREBASE CONFIG ---
# Path to the json file you downloaded in Step 1
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
# Found in your Firebase Storage dashboard (e.g., my-app.appspot.com)
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# --- CORS & URLs ---
# These MUST match the URL your frontend runs on
ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

3.  **Install & Run:**
    ```bash
    python -m venv venv
    venv\Scripts\activate  # On Windows
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
    ```

---

## ⚛️ Step 3: Frontend Configuration (`frontend/.env.local`)

1.  Navigate to the frontend folder: `cd frontend`
2.  Create a new file named `.env.local` and copy the following template using the credentials from Firebase (Step 1, Point 4):

```env
# --- FIREBASE WEB CONFIG ---
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456

# --- API URL ---
# In development, this uses the Vite proxy defined in vite.config.ts
VITE_API_URL=/api
```

3.  **Install & Run:**
    ```bash
    npm install
    npm run dev
    ```

---

## 🚀 Step 4: Final Validation

1.  **Backend Check:** Open `http://localhost:8000/api/health` in your browser. You should see `{"status": "healthy"}`.
2.  **Frontend Check:** Open `http://localhost:5173`. The landing page should appear.
3.  **Login Test:** Click "Get Started" and log in with Google. If successful, you will be redirected to the Dashboard.

---

## ❓ Troubleshooting Common Errors

| Issue | Likely Cause | Solution |
| :--- | :--- | :--- |
| **"ECONNREFUSED"** | Backend is not running or on wrong port. | Ensure `uvicorn` is running on port 8000. |
| **"CORS Error"** | `ALLOWED_ORIGINS` in `.env` is wrong. | Ensure it matches `http://localhost:5173` exactly (no slash at end). |
| **"Firebase Auth Error"** | Service account JSON missing. | Ensure `firebase-credentials.json` is in the `backend/` root. |
| **"Gemini API Error"** | API Key expired or invalid. | Verify your key at Google AI Studio. |
| **"Module Not Found"** | Dependencies not installed. | Run `pip install -r requirements.txt` or `npm install`. |

---

**Note:** Always remember to restart your servers (`uvicorn` and `npm run dev`) after changing any `.env` file for the changes to take effect!
