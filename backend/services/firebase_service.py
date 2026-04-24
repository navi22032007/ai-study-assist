import firebase_admin
from firebase_admin import credentials, auth, storage
import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

_app = None

def init_firebase():
    global _app

    if firebase_admin._apps:
        return firebase_admin.get_app()

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

    if cred_json:
        try:
            # Handle double-encoded JSON or escaped strings from env vars
            try:
                cred_data = json.loads(cred_json)
            except json.JSONDecodeError:
                # If first parse fails, it might be an escaped string
                import ast
                cred_data = json.loads(ast.literal_eval(f'"{cred_json}"'))
            
            if isinstance(cred_data, str):
                cred_data = json.loads(cred_data)
                
            # Fix escaped newlines in private key
            if isinstance(cred_data, dict) and "private_key" in cred_data:
                cred_data["private_key"] = cred_data["private_key"].replace("\\n", "\n")
                
            cred = credentials.Certificate(cred_data)
            print("[OK] Firebase initialized from JSON env var")
        except Exception as e:
            print(f"[CRITICAL ERROR] Failed to parse FIREBASE_CREDENTIALS_JSON: {str(e)}")
            # Log the first 20 chars of the string to help debug (DO NOT log private key)
            print(f"DEBUG: cred_json starts with: {str(cred_json)[:30]}...")
            raise e

    elif cred_path:
        cred_path = Path(cred_path).resolve()
        if not cred_path.exists():
            raise FileNotFoundError(f"Firebase credentials not found at {cred_path}")
        cred = credentials.Certificate(str(cred_path))

    else:
        raise ValueError("Firebase credentials not provided")

    _app = firebase_admin.initialize_app(cred, {
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET")
    })

    return _app


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return user info."""
    init_firebase()
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email", ""),
            "display_name": decoded_token.get("name", ""),
            "photo_url": decoded_token.get("picture", "")
        }
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")


async def upload_file_to_storage(file_data: bytes, filename: str, content_type: str, user_id: str) -> str:
    """Upload a file to Firebase Storage and return the download URL."""
    init_firebase()
    
    bucket = storage.bucket()
    blob = bucket.blob(f"documents/{user_id}/{filename}")
    
    blob.upload_from_string(file_data, content_type)
    
    # Make the blob publicly readable (or use signed URLs for private access)
    blob.make_public()
    
    return blob.public_url


async def delete_file_from_storage(file_url: str) -> None:
    """Delete a file from Firebase Storage."""
    init_firebase()
    
    bucket = storage.bucket()
    
    # Extract the blob name from the URL
    if "storage.googleapis.com" in file_url:
        # Format: https://storage.googleapis.com/BUCKET_NAME/PATH
        blob_name = file_url.split(f"{bucket.name}/")[-1]
    else:
        blob_name = file_url
    
    blob = bucket.blob(blob_name)
    if blob.exists():
        blob.delete()