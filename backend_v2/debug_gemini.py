import os
import sys
from modules.gemini import process_with_gemini

def test_gemini():
    test_text = "The High Court of Delhi hereby orders the Respondent to file a compliance affidavit within 4 weeks."
    print("Testing Gemini extraction...")
    result = process_with_gemini(test_text)
    print(f"Result: {result}")

if __name__ == "__main__":
    test_gemini()
