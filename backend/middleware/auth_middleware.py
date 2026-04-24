from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import jwt
import os

PUBLIC_PATHS = [
    "/health",
    "/auth/verify",
    "/share/public/",
    "/docs",
    "/openapi.json",
    "/redoc",
]

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Normalize path: remove double slashes and trailing slash for comparison
        path = request.url.path.replace("//", "/")
        clean_path = path.rstrip("/") if path != "/" else path
        
        # Allow public paths
        is_public = any(clean_path == p.rstrip("/") or clean_path.startswith(p) for p in PUBLIC_PATHS)
        
        # Log for debugging (remove in production if too noisy)
        print(f"[AUTH] Request: {request.method} {path} (Public: {is_public})")
        
        if is_public or request.method == "OPTIONS":
            return await call_next(request)
        
        # For everything else, enforce auth (except OPTIONS)
        if request.method != "OPTIONS":
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Missing or invalid authorization header"}
                )
            
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(
                    token,
                    os.getenv("JWT_SECRET", "your-secret-key"),
                    algorithms=["HS256"]
                )
                request.state.user_id = payload["uid"]
                request.state.user_email = payload.get("email", "")
            except jwt.ExpiredSignatureError:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Token expired"}
                )
            except jwt.InvalidTokenError:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid token"}
                )
        
        return await call_next(request)

def get_current_user(request: Request) -> dict:
    if not hasattr(request.state, "user_id"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "uid": request.state.user_id,
        "email": request.state.user_email
    }
