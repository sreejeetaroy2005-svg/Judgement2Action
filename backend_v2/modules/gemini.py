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
1. **Compliance Obligations**: Set `compliance_required` to true only if there are mandatory directives targeting a specific party. Use legal indicators like "peremptory", "time-bound", "shall", "must".
2. **Directive Extraction**: Extract DIRECTIVE SENTENCES — copy the exact sentences from the text. Focus on the 'Order' or 'Direction' section of the judgment.
3. **Timeline Identification**: Extract DEADLINES. If a deadline is relative (e.g., "within 4 weeks"), ensure the `associated_directive` context is preserved.
4. **Administrative Transformation**: In the `orders` field, provide a high-level administrative summary of each directive.
5. **Chain-of-Thought Reasoning**: Before providing the JSON, the model should internally identify the legal posture and core dispute to ensure context is not lost during extraction.

### JUDGMENT TEXT:
{text}

### OUTPUT (strict JSON, no markdown, no explanation):
{{
  "case_title": "Full case name",
  "court": "Court name",
  "date": "Judgment date",
  "parties": ["Petitioner", "Respondent"],
  "compliance_required": true,
  "appeal_possible": false,
  "directive_sentences": ["Exact sentence 1", "Exact sentence 2"],
  "deadlines": [
    {{
      "text": "Specific date or duration",
      "associated_directive": "Context from the order"
    }}
  ],
  "orders": ["Admin summary 1"],
  "preview_summary": ["Summary sentence 1", "Summary sentence 2"]
}}
"""

VERIFY_PROMPT_TEMPLATE = """
You are a Senior Legal Compliance Auditor. 
Your task is to verify the accuracy of legal signals extracted by an AI from a court judgment.

### ORIGINAL JUDGMENT TEXT (Snippet):
{text}

### AI-EXTRACTED SIGNALS:
{extracted_json}

### VERIFICATION TASKS:
1. **Hallucination Check**: Ensure every extracted 'directive_sentence' exists VERBATIM in the text. Remove any that are hallucinated.
2. **Deadline Validation**: Verify that the deadlines are correctly mapped to their directives.
3. **Missing Directives**: If you find a mandatory court order in the text that was missed, add it.

### OUTPUT:
Provide the updated, corrected JSON following the exact same schema.
"""

def verify_extraction(text: str, extracted_json: dict):
    """Reflexion Step: Verifies and corrects the first pass of AI extraction."""
    print("DEBUG: Starting Self-Correction (Reflexion) Loop...")
    try:
        prompt = VERIFY_PROMPT_TEMPLATE.format(
            text=text[:10000], 
            extracted_json=json.dumps(extracted_json, indent=2)
        )
        
        response = client.models.generate_content(
            model='gemini-flash-latest', # Use a fast stable model for verification
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        
        if response and response.text:
            clean_json = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_json)
    except Exception as e:
        print(f"WARN: Self-correction failed, falling back to original extraction: {e}")
    return extracted_json

def process_with_gemini(text: str, file_path: str = None):
    # Try multiple models in case of high demand or quota issues
    models_to_try = [
        'gemini-3.1-flash-lite-preview', 
        'gemini-2.0-flash',              
        'gemini-flash-latest'            
    ]
    
    # Context-aware chunking: prioritize the end of the judgment where orders usually are
    if len(text) > 30000:
        # Take first 10k (context) and last 20k (orders)
        text_for_ai = text[:10000] + "\n[...]\n" + text[-20000:]
    else:
        text_for_ai = text
        
    prompt = PROMPT_TEMPLATE.format(text=text_for_ai)
    
    last_error = None
    
    for model_name in models_to_try:
        print(f"DEBUG: Attempting extraction with model: {model_name}")
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={'response_mime_type': 'application/json'}
            )
            
            if not response or not response.text:
                continue

            clean_json = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean_json)
            
            # STEP 2: SELF-CORRECTION LOOP
            final_result = verify_extraction(text_for_ai, result)
            
            print(f"SUCCESS: Gemini extraction & verification complete. compliance={final_result.get('compliance_required')}")
            return final_result
            
        except Exception as e:
            last_error = str(e)
            print(f"ERROR: Model {model_name} failed: {last_error}")
            if "API_KEY_INVALID" in last_error:
                break
            continue
            
    print(f"CRITICAL: All Gemini models failed. Last error: {last_error}")
    return None
