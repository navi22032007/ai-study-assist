from fastapi import APIRouter, HTTPException, Request
from database import get_db
from middleware.auth_middleware import get_current_user
from schemas.schemas import ShareRequest, ShareResponse
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import secrets
import os

router = APIRouter()

@router.post("/create")
async def create_share_link(body: ShareRequest, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    try:
        doc = await db.documents.find_one(
            {"_id": ObjectId(body.document_id), "user_id": user["uid"]}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.documents.update_one(
        {"_id": ObjectId(body.document_id)},
        {"$set": {"share_token": token, "share_expires_at": expires_at}}
    )
    
    base_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    share_url = f"{base_url}/shared/{token}"
    
    return {
        "share_token": token,
        "share_url": share_url,
        "expires_at": expires_at.isoformat()
    }

@router.get("/public/{token}")
async def get_shared_document(token: str):
    db = get_db()
    
    doc = await db.documents.find_one(
        {"share_token": token},
        {"document_text": 0, "user_id": 0}
    )
    
    if not doc:
        raise HTTPException(status_code=404, detail="Shared document not found")
    
    expires_at = doc.get("share_expires_at")
    if expires_at and datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.delete("/{document_id}")
async def revoke_share_link(document_id: str, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    result = await db.documents.update_one(
        {"_id": ObjectId(document_id), "user_id": user["uid"]},
        {"$set": {"share_token": None, "share_expires_at": None}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Share link revoked"}
