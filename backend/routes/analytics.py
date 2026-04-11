from fastapi import APIRouter, Request
from database import get_db
from middleware.auth_middleware import get_current_user
from datetime import datetime, timezone, timedelta
from collections import defaultdict

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_analytics(request: Request):
    user = get_current_user(request)
    db = get_db()
    uid = user["uid"]
    
    # Get user info for streak
    user_doc = await db.users.find_one({"uid": uid})
    study_streak = user_doc.get("study_streak", 0) if user_doc else 0
    
    # Get all quiz attempts
    attempts = await db.quiz_attempts.find(
        {"user_id": uid}
    ).sort("created_at", -1).to_list(length=200)
    
    # Get document count
    doc_count = await db.documents.count_documents({"user_id": uid})
    
    if not attempts:
        return {
            "total_documents": doc_count,
            "total_quizzes": 0,
            "average_score": 0,
            "best_score": 0,
            "study_streak": study_streak,
            "weak_topics": [],
            "score_history": [],
            "topic_performance": [],
            "recent_activity": []
        }
    
    # Compute stats
    scores = [a["score"] for a in attempts]
    avg_score = sum(scores) / len(scores) if scores else 0
    best_score = max(scores) if scores else 0
    
    # Score history (last 30)
    score_history = []
    for a in reversed(attempts[:30]):
        score_history.append({
            "date": a["created_at"].isoformat() if hasattr(a["created_at"], "isoformat") else str(a["created_at"]),
            "score": a["score"],
            "document_title": a.get("document_title", ""),
            "difficulty": a.get("difficulty", "medium")
        })
    
    # Topic performance
    topic_data = defaultdict(lambda: {"correct": 0, "total": 0})
    all_weak = defaultdict(int)
    
    for a in attempts:
        for topic in a.get("weak_topics", []):
            all_weak[topic] += 1
        for qr in a.get("question_results", []):
            t = qr.get("topic", "General")
            topic_data[t]["total"] += 1
            if qr.get("is_correct"):
                topic_data[t]["correct"] += 1
    
    topic_performance = []
    for topic, data in topic_data.items():
        if data["total"] > 0:
            accuracy = data["correct"] / data["total"] * 100
            topic_performance.append({
                "topic": topic,
                "accuracy": round(accuracy, 1),
                "total_questions": data["total"],
                "correct": data["correct"]
            })
    
    topic_performance.sort(key=lambda x: x["accuracy"])
    
    weak_topics = sorted(all_weak.items(), key=lambda x: x[1], reverse=True)
    weak_topics = [t for t, _ in weak_topics[:5]]
    
    # Recent activity
    recent = []
    for a in attempts[:5]:
        recent.append({
            "type": "quiz",
            "document_title": a.get("document_title", ""),
            "score": a["score"],
            "date": a["created_at"].isoformat() if hasattr(a["created_at"], "isoformat") else str(a["created_at"])
        })
    
    return {
        "total_documents": doc_count,
        "total_quizzes": len(attempts),
        "average_score": round(avg_score, 2),
        "best_score": round(best_score, 2),
        "study_streak": study_streak,
        "weak_topics": weak_topics,
        "score_history": score_history,
        "topic_performance": topic_performance,
        "recent_activity": recent
    }
