from fastapi import APIRouter, HTTPException, Request
from schemas.schemas import TokenVerifyRequest, AuthResponse, UserInfo
from services.firebase_service import verify_firebase_token
from database import get_db
import jwt
import os
from datetime import datetime, timedelta, timezone

router = APIRouter()

def create_jwt_token(user_info: dict) -> str:
    payload = {
        "uid": user_info["uid"],
        "email": user_info.get("email", ""),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, os.getenv("JWT_SECRET", "your-secret-key"), algorithm="HS256")

@router.post("/verify", response_model=AuthResponse)
async def verify_token(request: TokenVerifyRequest):
    """Verify Firebase token and return JWT."""
    try:
        user_info = verify_firebase_token(request.firebase_token)
    except Exception as e:
        print(f"[AUTH] Firebase token verification failed: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {str(e)}")
    
    db = get_db()
    if db is None:
        print("[AUTH] Database not initialized")
        raise HTTPException(status_code=500, detail="Database connection not established. Please check backend logs.")
    
    try:
        # Upsert user in database
        now = datetime.now(timezone.utc)
        await db.users.update_one(
            {"uid": user_info["uid"]},
            {
                "$set": {
                    "uid": user_info["uid"],
                    "email": user_info.get("email", ""),
                    "display_name": user_info.get("display_name", ""),
                    "photo_url": user_info.get("photo_url", ""),
                    "last_login": now
                },
                "$setOnInsert": {
                    "created_at": now,
                    "study_streak": 0,
                    "xp_points": 0,
                    "last_study_date": None
                }
            },
            upsert=True
        )
        
        # Update study streak
        user_doc = await db.users.find_one({"uid": user_info["uid"]})
        if user_doc:
            last_study = user_doc.get("last_study_date")
            streak = user_doc.get("study_streak", 0)
            today = now.date()
            
            if last_study:
                # Ensure last_study is a datetime object or has date method
                last_date = last_study.date() if hasattr(last_study, 'date') else today
                if (today - last_date).days == 1:
                    streak += 1
                elif (today - last_date).days > 1:
                    streak = 1
            else:
                streak = 1
            
            await db.users.update_one(
                {"uid": user_info["uid"]},
                {"$set": {"study_streak": streak, "last_study_date": now}}
            )
            # Re-fetch updated doc
            user_doc = await db.users.find_one({"uid": user_info["uid"]})
        
        access_token = create_jwt_token(user_info)
        
        # Ensure access_token is a string (PyJWT < 2.0 returns bytes)
        if isinstance(access_token, bytes):
            access_token = access_token.decode('utf-8')
        
        return AuthResponse(
            user=UserInfo(
                uid=user_info["uid"],
                email=user_info.get("email", ""),
                display_name=user_info.get("display_name"),
                photo_url=user_info.get("photo_url"),
                xp_points=user_doc.get("xp_points", 0),
                study_streak=user_doc.get("study_streak", 0)
            ),
            access_token=access_token
        )
    except Exception as e:
        print(f"[AUTH] Internal error during verification: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/me", response_model=UserInfo)
async def get_me(request: Request):
    """Get current user info."""
    from middleware.auth_middleware import get_current_user
    user = get_current_user(request)
    db = get_db()
    
    user_doc = await db.users.find_one({"uid": user["uid"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserInfo(
        uid=user_doc["uid"],
        email=user_doc.get("email", ""),
        display_name=user_doc.get("display_name"),
        photo_url=user_doc.get("photo_url"),
        xp_points=user_doc.get("xp_points", 0),
        study_streak=user_doc.get("study_streak", 0)
    )

@router.post("/violation")
async def report_violation(request: Request):
    """Deduct 30 XP for a Focus Mode violation."""
    from middleware.auth_middleware import get_current_user
    user = get_current_user(request)
    db = get_db()
    
    # Deduct 30 XP (can go negative as per request)
    result = await db.users.find_one_and_update(
        {"uid": user["uid"]},
        {"$inc": {"xp_points": -30}},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "message": "Violation recorded. 30 XP deducted.",
        "new_xp": result.get("xp_points", 0)
    }
