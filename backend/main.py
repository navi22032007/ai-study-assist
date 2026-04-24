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
    try:
        from services.firebase_service import init_firebase
        init_firebase()
    except Exception as e:
        print(f"[CRITICAL] Firebase initialization failed on startup: {e}")
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
# --- Middleware Registration ---
# Middlewares are executed in reverse order of addition for requests.
# The LAST middleware added is the FIRST to receive the request.
# To ensure CORS headers are added to ALL responses (including errors), 
# CORSMiddleware must be the LAST one added.

from starlette.responses import Response

async def add_security_headers(request, call_next):
    if request.method == "OPTIONS":
        # Return explicit 200 for preflight instead of passing through
        response = Response(status_code=200)
        return response
    
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://fastapi.tiangolo.com; "
        "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://study-ai.up.railway.app;"
    )
    response.headers["Content-Security-Policy"] = csp
    return response

# Register middlewares
from starlette.middleware.base import BaseHTTPMiddleware
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(BaseHTTPMiddleware, dispatch=add_security_headers)

# CORSMiddleware is the OUTERMOST layer
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://study-ai-naveen.netlify.app",
        "https://study-ai.up.railway.app",
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

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Socket.IO — mount AFTER all routes, with FastAPI as fallback
from sockets import socket_app
import socketio

combined_app = socketio.ASGIApp(
    socketio_server=socket_app.engineio_app if hasattr(socket_app, 'engineio_app') else socket_app,
    other_asgi_app=app,
    socketio_path="socket.io"
)