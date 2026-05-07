import fitz  # PyMuPDF
import re

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file using PyMuPDF.
    """
    text = ""
    try:
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return clean_text(text)
    except Exception as e:
        print(f"Extraction Error: {e}")
        return ""

def clean_text(text: str) -> str:
    """
    Cleans extracted text by removing extra whitespaces and non-printable characters.
    """
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
