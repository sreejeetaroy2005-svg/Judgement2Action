import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
print(f"Key used: {key[:5]}...{key[-5:]}")

try:
    genai.configure(api_key=key)
    model = genai.GenerativeModel('models/gemini-flash-latest')
    response = model.generate_content("Say hello in JSON", generation_config={"response_mime_type": "application/json"})
    print(f"Success: {response.text}")
except Exception as e:
    print(f"Error: {e}")
