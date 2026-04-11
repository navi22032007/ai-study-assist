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
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {str(e)}")
    
    db = get_db()
    
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
    
    access_token = create_jwt_token(user_info)
    
    return AuthResponse(
        user=UserInfo(
            uid=user_info["uid"],
            email=user_info.get("email", ""),
            display_name=user_info.get("display_name"),
            photo_url=user_info.get("photo_url")
        ),
        access_token=access_token
    )

@router.get("/me")
async def get_me(request: Request):
    """Get current user info."""
    from middleware.auth_middleware import get_current_user
    user = get_current_user(request)
    db = get_db()
    
    user_doc = await db.users.find_one({"uid": user["uid"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_doc["id"] = str(user_doc["_id"])
    del user_doc["_id"]
    return user_doc
