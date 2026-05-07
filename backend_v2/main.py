import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from modules.extractor import extract_text_from_pdf
from modules.gemini import process_with_gemini
from modules.scoring import validate_and_enrich_actions
from modules.rag import find_similar_cases
import uuid
from datetime import datetime

from contextlib import asynccontextmanager
from modules.rag import get_collection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-loading RAG model can be slow/unstable on some systems
    # We will let it load lazily on the first request instead
    print("Backend starting up...")
    yield
    print("Backend shutting down...")

app = FastAPI(title="Judgment2Action API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

import json

# Persistent Storage for demo (JSON based for hackathon)
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cases_db.json")

def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_db():
    with open(DB_FILE, "w") as f:
        json.dump(cases_db, f, indent=2)

def log_accuracy_feedback(case_id: str, was_edited: bool):
    """Logs whether a case required human editing for future evaluation."""
    log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "accuracy_log.jsonl")
    log_entry = {
        "case_id": case_id,
        "timestamp": datetime.now().isoformat(),
        "was_edited": was_edited,
        "model_used": cases_db.get(case_id, {}).get("model_used", "unknown")
    }
    with open(log_file, "a") as f:
        f.write(json.dumps(log_entry) + "\n")

cases_db = load_db()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Judgment2Action FastAPI Backend is running"}

def process_in_background(file_id: str, file_path: str):
    """Runs the full Gemini pipeline in the background."""
    try:
        cases_db[file_id]["processing_status"] = "processing"

        # 1. Extract Text
        text = extract_text_from_pdf(file_path)
        cases_db[file_id]["processing_status"] = "extracting_signals"

        # 2. Process with Gemini
        raw_data = process_with_gemini(text)
        if not raw_data:
            cases_db[file_id]["processing_status"] = "error"
            cases_db[file_id]["error"] = "Gemini failed to extract signals."
            return

        if isinstance(raw_data, list):
            raw_data = raw_data[0] if raw_data else {}

        # 3. Rule-based action generation
        cases_db[file_id]["processing_status"] = "generating_actions"
        final_data = validate_and_enrich_actions(raw_data)

        # 4. RAG similarity search
        cases_db[file_id]["processing_status"] = "finding_similar_cases"
        final_data["similar_cases"] = find_similar_cases(text)

        # 5. Merge and mark done
        final_data["id"] = file_id
        final_data["status"] = "pending"
        final_data["processing_status"] = "done"
        final_data["created_at"] = cases_db[file_id]["created_at"]
        cases_db[file_id] = final_data
        save_db()
        print(f"Case {file_id} processed successfully.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        cases_db[file_id]["processing_status"] = "error"
        cases_db[file_id]["error"] = str(e)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/upload")
async def upload_judgment(pdf: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    if not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(pdf.file, buffer)

    # Initialise placeholder immediately
    cases_db[file_id] = {
        "id": file_id,
        "processing_status": "queued",
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "file_name": pdf.filename
    }
    save_db()

    # Kick off processing in the background
    background_tasks.add_task(process_in_background, file_id, file_path)

    # Return immediately — frontend polls /status/{file_id}
    return {"id": file_id, "processing_status": "queued"}

@app.get("/status/{case_id}")
async def get_status(case_id: str):
    """Poll this endpoint until processing_status == 'done' or 'error'."""
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found.")
    entry = cases_db[case_id]
    return {
        "id": case_id,
        "processing_status": entry.get("processing_status", "unknown"),
        "data": entry if entry.get("processing_status") == "done" else None,
        "error": entry.get("error")
    }

@app.get("/cases")
async def get_cases():
    return list(cases_db.values())

@app.get("/cases/{case_id}")
async def get_case(case_id: str):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found.")
    return cases_db[case_id]

@app.post("/verify/{case_id}")
async def verify_case(case_id: str, payload: dict = Body(...)):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    # Update status and data
    cases_db[case_id]["status"] = payload.get("status", "approved")
    cases_db[case_id]["actions"] = payload.get("actions", cases_db[case_id]["actions"])
    cases_db[case_id]["verified_at"] = datetime.now().isoformat()
    save_db()
    log_accuracy_feedback(case_id, was_edited=True) # Assuming every verification call potentially refines data

    return {"message": f"Case {cases_db[case_id]['status']} successfully", "id": case_id}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
