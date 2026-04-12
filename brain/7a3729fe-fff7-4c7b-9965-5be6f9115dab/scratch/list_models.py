import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv(dotenv_path='c:/Users/navee/Downloads/fixed-ai-study-assistant/ai-study-assist/backend/.env')

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    print("Listing available models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Model: {m.name}")
except Exception as e:
    print(f"Error: {e}")
