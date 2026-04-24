from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from routes import auth, documents, ai_features, quiz, analytics, share, certificates
from middleware.auth_middleware import AuthMiddleware
from middleware.rate_limiter import RateLimiterMiddleware
from database import init_db, close_db

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    try:
        from services.firebase_service import init_firebase
        init_firebase()
    except Exception as e:
        print(f"[CRITICAL] Firebase initialization failed on startup: {e}")
    yield
    await close_db()

app = FastAPI(
    title="AI Study Assistant API",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
def root():
    return {"status": "backend alive"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

app.add_middleware(RateLimiterMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://study-ai-naveen.netlify.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(ai_features.router, prefix="/ai", tags=["AI Features"])
app.include_router(quiz.router, prefix="/quiz", tags=["Quiz"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(share.router, prefix="/share", tags=["Share"])
app.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])

from sockets import socket_app
app.mount("/socket.io", socket_app)