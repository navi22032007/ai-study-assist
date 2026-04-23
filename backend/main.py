from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
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
    yield
    await close_db()

app = FastAPI(
    title="AI Study Assistant API",
    description="Full-stack AI-powered study assistant with Gemini integration",
    version="1.0.0",
    lifespan=lifespan
)
@app.get("/")
def root():
    return {"status": "backend alive"}
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimiterMiddleware)
app.add_middleware(AuthMiddleware)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    # Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Enable popups to work with cross-origin isolation (required for SharedArrayBuffer)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    
    # Content Security Policy (Basic)
    # We allow 'unsafe-inline' for styles/scripts temporarily to support common library patterns (like framer-motion/tailwind)
    # but restrict sources to self and trusted domains.
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://fastapi.tiangolo.com; "
        "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com;"
    )

    response.headers["Content-Security-Policy"] = csp
    
    return response

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(ai_features.router, prefix="/api/ai", tags=["AI Features"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(share.router, prefix="/api/share", tags=["Share"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificates"])

from sockets import socket_app
app.mount("/", socket_app)
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
