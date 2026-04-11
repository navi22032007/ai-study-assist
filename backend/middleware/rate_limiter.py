from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime, timezone
from database import get_db

AI_PATHS = ["/api/ai/", "/api/quiz/generate"]
RATE_LIMIT = 20  # per hour

class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        is_ai_path = any(path.startswith(p) for p in AI_PATHS)
        if not is_ai_path or not hasattr(request.state, "user_id"):
            return await call_next(request)
        
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            return await call_next(request)
        
        db = get_db()
        if db is None:
            return await call_next(request)
        
        try:
            count = await db.rate_limits.count_documents({
                "user_id": user_id,
                "path_type": "ai",
            })
            
            if count >= RATE_LIMIT:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": f"Rate limit exceeded. Max {RATE_LIMIT} AI requests per hour.",
                        "limit": RATE_LIMIT,
                        "current": count
                    }
                )
            
            await db.rate_limits.insert_one({
                "user_id": user_id,
                "path_type": "ai",
                "created_at": datetime.now(timezone.utc)
            })
        except Exception:
            pass  # Don't block request on rate limit errors
        
        return await call_next(request)
