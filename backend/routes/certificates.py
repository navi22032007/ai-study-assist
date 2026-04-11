from fastapi import APIRouter, HTTPException, Request
from database import get_db
from middleware.auth_middleware import get_current_user
from bson import ObjectId

router = APIRouter()

@router.get("/me")
async def get_my_certificates(request: Request):
    user = get_current_user(request)
    db = get_db()
    cursor = db.certificates.find({"user_id": user["uid"]}).sort("created_at", -1)
    certs = await cursor.to_list(length=100)
    for c in certs:
        c["id"] = str(c["_id"])
        del c["_id"]
    return certs

@router.get("/public/{token}")
async def public_verify_certificate(token: str):
    db = get_db()
    # No auth required for public verification
    cert = await db.certificates.find_one({"token": token})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid.")
    
    cert["id"] = str(cert["_id"])
    del cert["_id"]
    return cert
