import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:/Users/navee/Downloads/fixed-ai-study-assistant/ai-study-assist/backend/.env')
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model_name = "gemini-flash-latest"
print(f"Testing model: {model_name}")
try:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Hi")
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"Failed: {e}")

model_name = "gemini-2.5-flash-lite"
print(f"Testing model: {model_name}")
try:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Hi")
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"Failed: {e}")
