import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Initialize the new GenAI client
key = os.getenv("GEMINI_API_KEY")
if key:
    print(f"DEBUG: Using API Key: {key[:5]}...{key[-5:]}")
client = genai.Client(api_key=key)

PROMPT_TEMPLATE = """
You are a highly specialized Legal AI Assistant for Indian Law.
Your goal is to analyze a Supreme Court or High Court judgment and extract structured signals.

### EXTRACTION GOALS:
1. Set compliance_required to true if there are mandatory directives (words like "shall", "must", "directed", "ordered").
2. Set appeal_possible to true if the decision can still be appealed or challenged.
3. Extract all DIRECTIVE SENTENCES — copy the exact sentences that contain orders or directives.
4. Identify RESPONSIBLE ENTITIES — department names or officials named in the judgment.
5. Extract CASE METADATA — case title, court, date, and the names of petitioner and respondent.
6. Extract ORDERS — plain English summaries of each court order.
7. Extract a PREVIEW_SUMMARY — 5-10 key sentences from the judgment that give a complete overview of the decision.

### JUDGMENT TEXT:
{text}

### OUTPUT (strict JSON, no markdown, no explanation):
{{
  "case_title": "Full case name from text e.g. 'A vs B'",
  "court": "Name of the court",
  "date": "Date of judgment",
  "parties": ["Petitioner name", "Respondent name"],
  "compliance_required": true,
  "appeal_possible": false,
  "appeal_exhausted": false,
  "directive_sentences": [
    "Exact directive sentence copied from text"
  ],
  "responsible_entities": [
    "Department or official name"
  ],
  "deadlines": [
    {{
      "text": "Exact deadline phrase from text",
      "associated_directive": "The directive sentence this deadline belongs to"
    }}
  ],
  "orders": [
    "Plain English summary of court order 1"
  ],
  "preview_summary": [
    "Key sentence 1 from the judgment",
    "Key sentence 2 from the judgment"
  ]
}}
"""

def process_with_gemini(text: str, file_path: str = None):
    # Try multiple models in case of high demand or quota issues
    models_to_try = [
        'gemini-3.1-flash-lite-preview', # Primary (cutting edge)
        'gemini-2.0-flash',              # Secondary (stable, fast)
        'gemini-1.5-flash',              # Tertiary (very stable)
        'gemini-flash-latest'            # Final fallback
    ]
    
    truncated_text = text[:15000] if text else "No text could be extracted from the document."
    prompt = PROMPT_TEMPLATE.format(text=truncated_text)
    
    last_error = None
    
    for model_name in models_to_try:
        print(f"DEBUG: Attempting extraction with model: {model_name}")
        try:
            # Use the new SDK's generate_content
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    'response_mime_type': 'application/json'
                }
            )
            
            if not response or not response.text:
                print(f"WARN: Model {model_name} returned empty response.")
                continue

            # Clean JSON if markdown blocks are returned
            clean_json = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean_json)
            
            print(f"SUCCESS: Gemini extraction successful with {model_name}. compliance_required={result.get('compliance_required')}")
            return result
            
        except Exception as e:
            last_error = str(e)
            print(f"ERROR: Model {model_name} failed: {last_error}")
            # If it's a critical auth error, don't bother trying other models
            if "API_KEY_INVALID" in last_error:
                break
            continue
            
    print(f"CRITICAL: All Gemini models failed to extract signals. Last error: {last_error}")
    return None
