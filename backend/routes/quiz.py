from fastapi import APIRouter, HTTPException, Request
from database import get_db
from middleware.auth_middleware import get_current_user
from services import gemini_service
from schemas.schemas import QuizGenerateRequest, QuizSubmitRequest, QuizResult, QuizResultQuestion
from bson import ObjectId
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.post("/generate")
async def generate_quiz(body: QuizGenerateRequest, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    try:
        doc = await db.documents.find_one(
            {"_id": ObjectId(body.document_id), "user_id": user["uid"]},
            {"document_text": 1, "title": 1}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    text = doc.get("document_text", "")
    if not text:
        raise HTTPException(status_code=422, detail="Document has no text")
    
    question_types = [qt.value for qt in body.question_types] if body.question_types else None
    
    try:
        questions = await gemini_service.generate_quiz(
            text,
            body.count or 10,
            body.difficulty.value if body.difficulty else "medium",
            question_types
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")
    
    now = datetime.now(timezone.utc)
    quiz_doc = {
        "user_id": user["uid"],
        "document_id": body.document_id,
        "document_title": doc.get("title", ""),
        "questions": questions,
        "difficulty": body.difficulty.value if body.difficulty else "medium",
        "time_limit_minutes": 15,
        "attempted": False,
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.quizzes.insert_one(quiz_doc)
    quiz_doc["id"] = str(result.inserted_id)
    del quiz_doc["_id"]
    
    return quiz_doc

@router.get("/{quiz_id}")
async def get_quiz(quiz_id: str, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    try:
        quiz = await db.quizzes.find_one(
            {"_id": ObjectId(quiz_id), "user_id": user["uid"]}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Don't return correct answers if not yet attempted
    if not quiz.get("attempted", False):
        for q in quiz.get("questions", []):
            q.pop("correct_answer", None)
            q.pop("explanation", None)
    
    quiz["id"] = str(quiz["_id"])
    del quiz["_id"]
    return quiz

@router.post("/submit")
async def submit_quiz(body: QuizSubmitRequest, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    try:
        quiz = await db.quizzes.find_one(
            {"_id": ObjectId(body.quiz_id), "user_id": user["uid"]}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if quiz.get("attempted", False):
        raise HTTPException(status_code=409, detail="Quiz already attempted. Generate a new quiz to retry.")
    
    # Grade the quiz
    questions_map = {q["id"]: q for q in quiz.get("questions", [])}
    answers_map = {a.question_id: a.answer for a in body.answers}
    
    question_results = []
    correct_count = 0
    
    for q_id, question in questions_map.items():
        user_answer = answers_map.get(q_id, "")
        correct_answer = question["correct_answer"]
        
        # Case-insensitive comparison for fill_blank and true_false
        is_correct = user_answer.strip().lower() == correct_answer.strip().lower()
        
        question_results.append({
            "question_id": q_id,
            "question": question["question"],
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "explanation": question.get("explanation", ""),
            "topic": question.get("topic", "General")
        })
        
        if is_correct:
            correct_count += 1
    
    total = len(questions_map)
    score = (correct_count / total * 100) if total > 0 else 0
    
    # Detect weak topics
    topic_results = {}
    for qr in question_results:
        t = qr["topic"]
        if t not in topic_results:
            topic_results[t] = {"correct": 0, "total": 0}
        topic_results[t]["total"] += 1
        if qr["is_correct"]:
            topic_results[t]["correct"] += 1
    
    weak_topics = [
        t for t, s in topic_results.items()
        if s["total"] > 0 and s["correct"] / s["total"] < 0.6
    ]
    
    now = datetime.now(timezone.utc)
    import secrets
    certificate_token = None
    if score >= 80:
        token = secrets.token_hex(16)
        cert_doc = {
            "user_id": user["uid"],
            "user_name": user.get("name", user.get("email", "Student").split("@")[0].capitalize()),
            "document_id": quiz["document_id"],
            "topic": quiz.get("document_title", "Unknown Topic"),
            "score": round(score, 2),
            "token": token,
            "quiz_id": body.quiz_id,
            "created_at": now
        }
        cert_result = await db.certificates.insert_one(cert_doc)
        certificate_token = token

    attempt_doc = {
        "quiz_id": body.quiz_id,
        "document_id": quiz["document_id"],
        "user_id": user["uid"],
        "score": round(score, 2),
        "total_questions": total,
        "correct_answers": correct_count,
        "time_taken_seconds": body.time_taken_seconds,
        "question_results": question_results,
        "weak_topics": weak_topics,
        "difficulty": quiz.get("difficulty", "medium"),
        "document_title": quiz.get("document_title", ""),
        "certificate_token": certificate_token,
        "created_at": now
    }
    
    result = await db.quiz_attempts.insert_one(attempt_doc)
    attempt_doc["id"] = str(result.inserted_id)
    del attempt_doc["_id"]
    
    # Mark quiz as attempted
    await db.quizzes.update_one(
        {"_id": ObjectId(body.quiz_id)},
        {"$set": {"attempted": True, "attempt_id": attempt_doc["id"], "updated_at": now}}
    )
    
    return attempt_doc

@router.get("/attempt/{attempt_id}")
async def get_quiz_attempt(attempt_id: str, request: Request):
    user = get_current_user(request)
    db = get_db()
    
    try:
        attempt = await db.quiz_attempts.find_one(
            {"_id": ObjectId(attempt_id), "user_id": user["uid"]}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid attempt ID")
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
    
    attempt["id"] = str(attempt["_id"])
    del attempt["_id"]
    return attempt

@router.get("/history/all")
async def get_quiz_history(request: Request, limit: int = 20):
    user = get_current_user(request)
    db = get_db()
    
    cursor = db.quiz_attempts.find(
        {"user_id": user["uid"]},
        {"question_results": 0}
    ).sort("created_at", -1).limit(limit)
    
    attempts = await cursor.to_list(length=limit)
    for a in attempts:
        a["id"] = str(a["_id"])
        del a["_id"]
    
    return {"attempts": attempts, "total": len(attempts)}
