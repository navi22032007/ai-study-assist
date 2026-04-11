from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
import certifi

client: Optional[AsyncIOMotorClient] = None
db = None

async def init_db():
    global client, db
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
    db = client[os.getenv("MONGODB_DB", "ai_study_assistant")]
    
    # Create indexes
    await db.documents.create_index("user_id")
    await db.documents.create_index("share_token")
    await db.quiz_attempts.create_index("user_id")
    await db.quiz_attempts.create_index("document_id")
    await db.rate_limits.create_index("user_id")
    await db.rate_limits.create_index([("created_at", 1)], expireAfterSeconds=3600)
    print("[OK] MongoDB connected and indexes created")

async def close_db():
    global client
    if client:
        client.close()

def get_db():
    return db
