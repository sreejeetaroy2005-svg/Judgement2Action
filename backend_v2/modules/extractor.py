import fitz  # PyMuPDF
import re

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file. 
    Includes a heuristic check for image-only (scanned) PDFs.
    """
    text = ""
    try:
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        
        # Heuristic: If we have multiple pages but very little text, it's likely a scan
        if len(text.strip()) < 100 and len(doc) > 0:
            print("WARNING: Low text density detected. This PDF might be a scan and require OCR.")
            # For hackathon, we can return a placeholder or specific error
            # return "IMAGE_ONLY_PDF_DETECTED_NEEDS_OCR"
        
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
