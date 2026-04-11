from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from database import get_db
from middleware.auth_middleware import get_current_user
from services.firebase_service import upload_file_to_storage, delete_file_from_storage
from services.file_service import extract_text, validate_file
from schemas.schemas import DocumentResponse, DocumentListResponse
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import io
import csv
import json

router = APIRouter()

def doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(None),
    folder: str = Form("Default")
):
    user = get_current_user(request)
    
    file_data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    filename = file.filename or "document"
    
    is_valid, error_msg = validate_file(file_data, filename, content_type)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Extract text
    try:
        document_text = extract_text(file_data, content_type)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to extract text: {str(e)}")
    
    if not document_text or len(document_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Document appears to be empty or has too little content")
    
    # Upload to Firebase Storage
    unique_filename = f"{uuid.uuid4()}_{filename}"
    try:
        file_url = await upload_file_to_storage(file_data, unique_filename, content_type, user["uid"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user["uid"],
        "title": title or filename.rsplit(".", 1)[0],
        "filename": filename,
        "unique_filename": unique_filename,
        "file_url": file_url,
        "file_size": len(file_data),
        "file_type": content_type,
        "folder": folder,
        "document_text": document_text,
        "summary": None,
        "key_points": [],
        "flashcards": [],
        "mind_map": None,
        "share_token": None,
        "share_expires_at": None,
        "created_at": now,
        "updated_at": now
    }
    
    db = get_db()
    result = await db.documents.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    del doc["document_text"]  # Don't return full text
    
    return doc

@router.get("/")
async def list_documents(request: Request, folder: str = None, search: str = None):
    user = get_current_user(request)
    db = get_db()
    
    query = {"user_id": user["uid"]}
    if folder:
        query["folder"] = folder
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"filename": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = db.documents.find(query, {"document_text": 0}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    
    result = []
    for doc in docs:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        result.append(doc)
    
    return {"documents": result, "total": len(result)}

@router.get("/folders")
async def get_folders(request: Request):
    user = get_current_user(request)
    db = get_db()
    
    folders = await db.documents.distinct("folder", {"user_id": user["uid"]})
    return {"folders": folders}

@router.get("/{document_id}")
async def get_document(document_id: str, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    try:
        doc = await db.documents.find_one(
            {"_id": ObjectId(document_id), "user_id": user["uid"]},
            {"document_text": 0}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.delete("/{document_id}")
async def delete_document(document_id: str, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    try:
        doc = await db.documents.find_one(
            {"_id": ObjectId(document_id), "user_id": user["uid"]}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from Firebase Storage
    try:
        await delete_file_from_storage(doc["file_url"])
    except Exception:
        pass  # Continue even if storage deletion fails
    
    await db.documents.delete_one({"_id": ObjectId(document_id)})
    await db.quizzes.delete_many({"document_id": document_id})
    await db.quiz_attempts.delete_many({"document_id": document_id})
    
    return {"message": "Document deleted successfully"}

@router.patch("/{document_id}")
async def update_document(document_id: str, request: Request):
    user = get_current_user(request)
    db = get_db()

    body = await request.json()
    allowed_fields = {"title", "folder"}
    update = {k: v for k, v in body.items() if k in allowed_fields}
    
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.documents.update_one(
        {"_id": ObjectId(document_id), "user_id": user["uid"]},
        {"$set": update}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document updated"}

@router.post("/{document_id}/bookmark-keypoint")
async def toggle_bookmark(document_id: str, request: Request):
    user = get_current_user(request)
    db = get_db()
    body = await request.json()
    point_index = body.get("index")
    bookmarked = body.get("bookmarked", True)
    
    doc = await db.documents.find_one(
        {"_id": ObjectId(document_id), "user_id": user["uid"]},
        {"key_points": 1}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    key_points = doc.get("key_points", [])
    if point_index is None or point_index >= len(key_points):
        raise HTTPException(status_code=400, detail="Invalid key point index")
    
    key_points[point_index]["bookmarked"] = bookmarked
    
    await db.documents.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": {"key_points": key_points, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Bookmark updated"}

@router.get("/{document_id}/export/csv")
async def export_quiz_csv(document_id: str, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    quiz = await db.quizzes.find_one(
        {"document_id": document_id, "user_id": user["uid"]},
        sort=[("created_at", -1)]
    )
    if not quiz:
        raise HTTPException(status_code=404, detail="No quiz found for this document")
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Question", "Type", "Options", "Correct Answer", "Explanation", "Topic"])
    
    for q in quiz.get("questions", []):
        writer.writerow([
            q["question"],
            q["type"],
            " | ".join(q.get("options") or []),
            q["correct_answer"],
            q["explanation"],
            q["topic"]
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=quiz_{document_id}.csv"}
    )
