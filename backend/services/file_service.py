import fitz  # PyMuPDF
import io
from typing import Tuple

def extract_text_from_pdf(file_data: bytes) -> Tuple[str, int]:
    """Extract text from PDF bytes. Returns (text, page_count)."""
    doc = fitz.open(stream=file_data, filetype="pdf")
    texts = []
    for page in doc:
        text = page.get_text("text")
        texts.append(text)
    doc.close()
    full_text = "\n\n".join(texts)
    return full_text, len(texts)

def extract_text_from_txt(file_data: bytes) -> str:
    """Extract text from TXT bytes."""
    try:
        return file_data.decode("utf-8")
    except UnicodeDecodeError:
        return file_data.decode("latin-1", errors="replace")

def extract_text(file_data: bytes, file_type: str) -> str:
    """Extract text based on file type."""
    if file_type == "application/pdf":
        text, _ = extract_text_from_pdf(file_data)
        return text
    elif file_type in ["text/plain", "text/txt"]:
        return extract_text_from_txt(file_data)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

def validate_file(file_data: bytes, filename: str, content_type: str) -> Tuple[bool, str]:
    """Validate uploaded file. Returns (is_valid, error_message)."""
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_TYPES = ["application/pdf", "text/plain"]
    ALLOWED_EXTENSIONS = [".pdf", ".txt"]
    
    if len(file_data) > MAX_SIZE:
        return False, f"File size exceeds 10MB limit ({len(file_data) / 1024 / 1024:.1f}MB)"
    
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type. Only PDF and TXT files are allowed."
    
    if content_type not in ALLOWED_TYPES and not content_type.startswith("text/"):
        return False, f"Invalid content type: {content_type}"
    
    return True, ""
