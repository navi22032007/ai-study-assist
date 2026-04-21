import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    mongo_url = os.getenv("MONGODB_URL")
    print(f"Testing connection to: {mongo_url.split('@')[-1]}")
    
    try:
        client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        # The ismaster command is cheap and does not require auth
        await client.admin.command('ismaster')
        print("Successfully connected to MongoDB!")
        
        db = client[os.getenv("MONGODB_DB", "ai_study_assistant")]
        print(f"Testing index creation on {db.name}.test_collection...")
        await db.test_collection.create_index("test_field")
        print("Successfully created index!")
        
    except Exception as e:
        print(f"Connection failed: {type(e).__name__}: {e}")
        if "10054" in str(e):
            print("\nDIAGNOSIS: The connection was forcibly closed by the remote host.")
            print("This usually means your IP address is not whitelisted in MongoDB Atlas.")
            print("Action: Go to MongoDB Atlas -> Network Access -> Add your current IP address (or 0.0.0.0/0 for testing).")

if __name__ == "__main__":
    asyncio.run(test_connection())
