from google import genai
from google.genai import types
import os
import json
import re
import uuid
from typing import List, Optional, Any
import asyncio

# Initialize Global Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def retry_gemini(func):
    """Decorator to retry Gemini API calls with exponential backoff."""
    async def wrapper(*args, **kwargs):
        max_retries = 3
        backoff = 2
        for i in range(max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower():
                    if i == max_retries - 1:
                        raise e
                    wait_time = backoff ** (i + 1)
                    print(f"[Gemini] Quota hit, retrying in {wait_time}s... (Attempt {i+1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                else:
                    raise e
    return wrapper

# Default model name
MODEL_NAME = "gemini-2.5-flash-lite"

def safe_json_parse(text: str) -> Any:
    """Parse JSON with fallback cleanup."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    for pattern in [r"(\[[\s\S]*\])", r"(\{[\s\S]*\})"]:
        match = re.search(pattern, text)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue
    
    raise ValueError(f"Could not parse JSON from response: {text[:200]}")

GROUNDING_PREFIX = """You are an AI study assistant. You MUST answer ONLY based on the provided document content below.
Do NOT use any external knowledge or make up information not present in the document.
If the answer cannot be found in the document, say "This information is not available in the provided document."

DOCUMENT CONTENT:
---
{content}
---

"""

@retry_gemini
async def generate_summary(document_text: str) -> str:
    prompt = GROUNDING_PREFIX.format(content=document_text[:15000]) + """
Generate a concise summary of the document in EXACTLY 200 words or fewer.
- Focus on the main concepts, arguments, and conclusions
- Write in clear, academic prose
- Do NOT use bullet points
- Return ONLY the summary text, nothing else
"""
    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            top_p=0.9,
            max_output_tokens=4096,
        )
    )
    summary = response.text.strip()
    
    words = summary.split()
    if len(words) > 200:
        summary = " ".join(words[:200]) + "..."
    
    return summary

@retry_gemini
async def generate_key_points(document_text: str) -> List[dict]:
    prompt = GROUNDING_PREFIX.format(content=document_text[:15000]) + """
Extract 5-10 key points from the document.
Return ONLY a valid JSON array with NO other text. Format:
[
  {"point": "Key concept or fact", "importance_level": "high", "topic": "topic name"},
  {"point": "Another key point", "importance_level": "medium", "topic": "topic name"}
]
importance_level must be: "high", "medium", or "low"
"""
    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            top_p=0.9,
            max_output_tokens=8192,
            response_mime_type="application/json"
        )
    )
    data = safe_json_parse(response.text)
    
    if not isinstance(data, list):
        raise ValueError("Expected list of key points")
    
    result = []
    for item in data:
        result.append({
            "point": str(item.get("point", "")),
            "importance_level": item.get("importance_level", "medium"),
            "topic": str(item.get("topic", "General")),
            "bookmarked": False
        })
    return result

@retry_gemini
async def generate_flashcards(document_text: str, count: int = 10) -> List[dict]:
    prompt = GROUNDING_PREFIX.format(content=document_text[:15000]) + f"""
Create exactly {count} flashcards from the document content.
Return ONLY a valid JSON array with NO other text. Format:
[
  {{"front": "Question or term", "back": "Answer or definition", "topic": "topic name"}},
  ...
]
"""
    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            top_p=0.9,
            max_output_tokens=8192,
            response_mime_type="application/json"
        )
    )
    data = safe_json_parse(response.text)
    
    if not isinstance(data, list):
        raise ValueError("Expected list of flashcards")
    
    return [{"front": str(f.get("front", "")), "back": str(f.get("back", "")), "topic": str(f.get("topic", "General"))} for f in data[:count]]

@retry_gemini
async def generate_quiz(document_text: str, count: int = 10, difficulty: str = "medium", question_types: Optional[List[str]] = None) -> List[dict]:
    types_instruction = ""
    if question_types:
        types_instruction = f"Question types to include: {', '.join(question_types)}."
    else:
        types_instruction = "Mix of MCQ (multiple choice with 4 options), true_false, and fill_blank questions."
    
    diff_map = {
        "easy": "Use simple, direct questions testing basic recall",
        "medium": "Use application and comprehension questions",
        "hard": "Use analysis, synthesis and evaluation questions requiring deep understanding"
    }
    
    prompt = GROUNDING_PREFIX.format(content=document_text[:15000]) + f"""
Generate exactly {count} quiz questions from the document. Difficulty: {difficulty}. {diff_map.get(difficulty, '')}
{types_instruction}

Return ONLY a valid JSON array with NO other text. Format:
[
  {{
    "question": "Question text",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Why this is correct based on the document",
    "topic": "topic from document"
  }},
  {{
    "question": "True or False statement",
    "type": "true_false",
    "options": ["True", "False"],
    "correct_answer": "True",
    "explanation": "...",
    "topic": "..."
  }}
]
Rules:
1. For 'mcq', provide exactly 4 options.
2. For 'true_false', provide EXACTLY ["True", "False"] in the 'options' field.
3. For 'fill_blank', the 'options' field should be null or omitted.
4. All answers must be grounded in the document content only.
"""
    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            top_p=0.9,
            max_output_tokens=8192,
            response_mime_type="application/json"
        )
    )
    data = safe_json_parse(response.text)
    
    if not isinstance(data, list):
        raise ValueError("Expected list of questions")
    
    result = []
    for q in data[:count]:
        q_type = q.get("type", "mcq")
        options = q.get("options")
        
        # Ensure true_false always has options
        if q_type == "true_false" and not options:
            options = ["True", "False"]
            
        result.append({
            "id": str(uuid.uuid4()),
            "question": str(q.get("question", "")),
            "type": q_type,
            "options": options,
            "correct_answer": str(q.get("correct_answer", "")),
            "explanation": str(q.get("explanation", "")),
            "topic": str(q.get("topic", "General"))
        })
    return result

@retry_gemini
async def chat_with_document(document_text: str, message: str, history: List[dict]) -> str:
    history_text = ""
    for msg in history[-6:]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['content']}\n"
    
    prompt = GROUNDING_PREFIX.format(content=document_text[:12000]) + f"""
Previous conversation:
{history_text}

Current question: {message}

Answer ONLY based on the document content. Be helpful, clear and concise.
"""
    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            top_p=0.9,
            max_output_tokens=4096,
        )
    )
    return response.text.strip()

@retry_gemini
async def generate_eli5(document_text: str, topic: Optional[str] = None) -> str:
    topic_instruction = f"Focus on explaining: {topic}" if topic else "Explain the main concept"
    
    prompt = GROUNDING_PREFIX.format(content=document_text[:10000]) + f"""
{topic_instruction} from this document as if explaining to a 5-year-old child.
Use simple words, fun analogies, and relatable comparisons.
"""
    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            top_p=0.9,
            max_output_tokens=2048,
        )
    )
    return response.text.strip()

@retry_gemini
async def translate_content(content: str, target_language: str) -> str:
    prompt = f"""Translate the following text to {target_language}.
Keep all meaning intact. Preserve formatting.
Return ONLY the translated text.

TEXT TO TRANSLATE:
{content}
"""
    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=8192,
        )
    )
    return response.text.strip()

@retry_gemini
async def generate_mind_map(document_text: str) -> dict:
    prompt = GROUNDING_PREFIX.format(content=document_text[:12000]) + """
Create a mind map structure from the document content.
Return ONLY a valid JSON object.
"""
    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=8192,
            response_mime_type="application/json"
        )
    )
    data = safe_json_parse(response.text)
    return data

async def detect_weak_topics(quiz_results: List[dict]) -> List[str]:
    topic_scores = {}
    for result in quiz_results:
        for qr in result.get("question_results", []):
            topic = qr.get("topic", "General")
            if topic not in topic_scores:
                topic_scores[topic] = {"correct": 0, "total": 0}
            topic_scores[topic]["total"] += 1
            if qr.get("is_correct"):
                topic_scores[topic]["correct"] += 1
    
    weak = []
    for topic, scores in topic_scores.items():
        if scores["total"] > 0:
            accuracy = scores["correct"] / scores["total"]
            if accuracy < 0.6:
                weak.append(topic)
    return weak

@retry_gemini
async def analyze_diagram(image_b64: str, mime_type: str) -> dict:
    """Analyze a diagram/image using Gemini Vision multimodal capability.
    Combines classification and analysis into a single request to save quota.
    """
    image_part = types.Part.from_bytes(
        data=image_b64,
        mime_type=mime_type
    )

    # Optimized prompt to do everything in one go
    prompt = """Look at this image and analyze it for an educational study assistant.
Step 1: Determine if this is a "diagram" (chart, graph, flowchart, table, map, illustration, infographic) or a "text_document" (mostly just written words).
Step 2: If it's a "text_document", set is_diagram to false.
Step 3: If it's a "diagram", provide a detailed analysis.

Return ONLY a JSON object with this exact schema:
{
  "is_diagram": boolean,
  "title": "A short, clear title describing the image (if it's a diagram)",
  "explanation": "A detailed plain-language explanation of what this image shows (if it's a diagram)",
  "components": ["Key label 1", "Key label 2", "Important part 3"],
  "quiz_questions": [
    {
      "question": "A question specifically about something visible in this diagram",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A"
    },
    {
      "question": "Another question about the diagram",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B"
    }
  ]
}

Rules:
- If is_diagram is false, other fields can be null or empty.
- Include exactly 2 quiz questions for diagrams based ONLY on visual content.
"""

    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=[prompt, image_part],
        config=types.GenerateContentConfig(
            temperature=0.3,
            response_mime_type="application/json"
        )
    )
    data = safe_json_parse(response.text)
    
    if not data.get("is_diagram", False):
        return None
        
    return data
