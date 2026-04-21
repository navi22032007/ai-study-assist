from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
import certifi
import dns.resolver

# Use Google Public DNS to resolve MongoDB Atlas SRV records
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ["8.8.8.8", "8.8.4.4"]

client: Optional[AsyncIOMotorClient] = None
db = None

async def init_db():
    global client, db
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    
    # Standard Atlas connection options
    options = {
        "tlsCAFile": certifi.where(),
        "serverSelectionTimeoutMS": 10000,
        "connectTimeoutMS": 10000,
        "retryWrites": True,
        "w": "majority"
    }
    
    try:
        client = AsyncIOMotorClient(mongo_url, **options)
        db = client[os.getenv("MONGODB_DB", "ai_study_assistant")]
        
        # Verify connection immediately
        await client.admin.command('ping')
        
        # Create indexes
        await db.documents.create_index("user_id")
        await db.documents.create_index("share_token")
        await db.quiz_attempts.create_index("user_id")
        await db.quiz_attempts.create_index("document_id")
        await db.rate_limits.create_index("user_id")
        await db.rate_limits.create_index([("created_at", 1)], expireAfterSeconds=3600)
        print("[OK] MongoDB connected and indexes created")
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        if "10054" in str(e) or "forcibly closed" in str(e).lower():
            print("\n" + "!"*60)
            print("DIAGNOSIS: Connection closed by remote host (WinError 10054)")
            print("This is usually caused by the MongoDB Atlas IP Whitelist.")
            print("FIX: Go to MongoDB Atlas -> Network Access -> Add 0.0.0.0/0 (for testing)")
            print("!"*60 + "\n")
        raise e

async def close_db():
    global client
    if client:
        client.close()

def get_db():
    return db
