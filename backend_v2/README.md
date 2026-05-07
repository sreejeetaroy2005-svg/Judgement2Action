# Judgment2Action - FastAPI Backend (v2)

This is the modernized Python backend for Judgment2Action, built with FastAPI and Google Gemini 1.5 Flash. It handles the full pipeline from PDF extraction to risk-assessed action plans and legal precedent matching.

## 🧠 Core Modules

### 1. `gemini.py`
The AI heart of the system.
- **Advanced Prompting**: Uses specialized legal prompts for Indian Law to extract directives, parties, and operative sentences.
- **Preview Summary**: Generates a structured 5-10 point summary for document previews.
- **Strict JSON**: Leverages Gemini's JSON mode for reliable frontend integration.

### 2. `rag.py` (Legal Precedents)
Integrates a vector database for similarity search.
- **ChromaDB**: Stores embeddings for historical SC judgments (1950-2024).
- **Sentence Boundaries**: Intelligent snippet truncation ensures clean, readable precedent text.
- **Semantic Search**: Uses `all-MiniLM-L6-v2` embeddings to match the current case with historical precedents.

### 3. `scoring.py` (Nuance Engine)
A rule-based engine that processes AI signals to:
- **Sanitize Text**: Removes malformed Unicode quotes and normalizes whitespace.
- **Administrative Mapping**: Converts legal directives into actionable department tasks.
- **Risk Assessment**: Assigns **Risk Levels** (CRITICAL, HIGH, MEDIUM) based on contempt triggers and deadlines.

### 4. `extractor.py`
Uses `PyMuPDF` for fast, reliable text extraction and cleaning from digital PDFs.

## 🛠️ Setup & Ingestion

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Environment Variables**:
   Create a `.env` file:
   ```env
   GEMINI_API_KEY=your_google_ai_key
   ```
3. **Ingest Historical Data**:
   Download the SC Judgments dataset and point `ingest_kaggle.py` to its path, then run:
   ```bash
   python ingest_kaggle.py
   ```
4. **Run Server**:
   ```bash
   python main.py
   ```

## 🔌 API Endpoints

- `POST /upload`: Upload a judgment PDF for background processing.
- `GET /status/{case_id}`: Poll for processing status (`queued` -> `extracting` -> `done`).
- `GET /cases`: List all processed judgments.
- `GET /cases/{case_id}`: Get full details of a specific case.
- `POST /verify/{case_id}`: Approve or Reject the AI-generated action plan.
