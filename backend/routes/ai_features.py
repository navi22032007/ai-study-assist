from fastapi import APIRouter, HTTPException, Request
from database import get_db
from middleware.auth_middleware import get_current_user
from services import gemini_service
from schemas.schemas import (
    SummaryRequest, SummaryResponse, KeyPointsRequest, KeyPointsResponse,
    FlashcardsRequest, FlashcardsResponse, ELI5Request, ELI5Response,
    TranslationRequest, TranslationResponse, ChatRequest, ChatResponse,
    MindMapRequest, MindMapResponse
)
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()

async def get_document_text(document_id: str, user_id: str, db) -> str:
    try:
        doc = await db.documents.find_one(
            {"_id": ObjectId(document_id), "user_id": user_id},
            {"document_text": 1}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    text = doc.get("document_text", "")
    if not text:
        raise HTTPException(status_code=422, detail="Document has no extractable text")
    
    return text

@router.post("/summary", response_model=SummaryResponse)
async def generate_summary(body: SummaryRequest, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    text = await get_document_text(body.document_id, user["uid"], db)
    
    try:
        summary = await gemini_service.generate_summary(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
    
    # Cache summary in document
    await db.documents.update_one(
        {"_id": ObjectId(body.document_id)},
        {"$set": {"summary": summary, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return SummaryResponse(
        document_id=body.document_id,
        summary=summary,
        word_count=len(summary.split())
    )

@router.post("/key-points", response_model=KeyPointsResponse)
async def generate_key_points(body: KeyPointsRequest, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    text = await get_document_text(body.document_id, user["uid"], db)
    
    try:
        key_points = await gemini_service.generate_key_points(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
    
    await db.documents.update_one(
        {"_id": ObjectId(body.document_id)},
        {"$set": {"key_points": key_points, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return KeyPointsResponse(
        document_id=body.document_id,
        key_points=key_points
    )

@router.post("/flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(body: FlashcardsRequest, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    text = await get_document_text(body.document_id, user["uid"], db)
    
    try:
        flashcards = await gemini_service.generate_flashcards(text, body.count or 10)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
    
    await db.documents.update_one(
        {"_id": ObjectId(body.document_id)},
        {"$set": {"flashcards": flashcards, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return FlashcardsResponse(document_id=body.document_id, flashcards=flashcards)

@router.post("/eli5", response_model=ELI5Response)
async def generate_eli5(body: ELI5Request, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    text = await get_document_text(body.document_id, user["uid"], db)
    
    try:
        explanation = await gemini_service.generate_eli5(text, body.topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
    
    return ELI5Response(document_id=body.document_id, explanation=explanation)

@router.post("/translate", response_model=TranslationResponse)
async def translate_content(body: TranslationRequest, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    try:
        doc = await db.documents.find_one(
            {"_id": ObjectId(body.document_id), "user_id": user["uid"]},
            {"summary": 1, "key_points": 1}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if body.content_type == "summary":
        content = doc.get("summary", "")
        if not content:
            raise HTTPException(status_code=400, detail="Generate summary first before translating")
    else:
        kp = doc.get("key_points", [])
        content = "\n".join([p["point"] for p in kp]) if kp else ""
        if not content:
            raise HTTPException(status_code=400, detail="Generate key points first before translating")
    
    try:
        translated = await gemini_service.translate_content(content, body.target_language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
    
    return TranslationResponse(
        document_id=body.document_id,
        translated_content=translated,
        target_language=body.target_language
    )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(body: ChatRequest, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    text = await get_document_text(body.document_id, user["uid"], db)
    
    history = [{"role": m.role, "content": m.content} for m in body.history]
    
    try:
        response = await gemini_service.chat_with_document(text, body.message, history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
    
    return ChatResponse(document_id=body.document_id, response=response)

@router.post("/mind-map", response_model=MindMapResponse)
async def generate_mind_map(body: MindMapRequest, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    text = await get_document_text(body.document_id, user["uid"], db)
    
    try:
        mind_map = await gemini_service.generate_mind_map(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mind map generation failed: {str(e)}")
    
    await db.documents.update_one(
        {"_id": ObjectId(body.document_id)},
        {"$set": {"mind_map": mind_map, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return MindMapResponse(
        document_id=body.document_id,
        nodes=mind_map.get("nodes", []),
        edges=mind_map.get("edges", [])
    )
