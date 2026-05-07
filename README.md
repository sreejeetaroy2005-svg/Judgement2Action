# Judgment2Action

**AI-powered Legal Workflow Automation**

Judgment2Action is an automated pipeline designed to transform complex court judgments into actionable strategic plans. It uses Google's Gemini 1.5 Flash model and a custom Legal RAG (Retrieval-Augmented Generation) engine to extract directives, identify deadlines, and generate risk-assessed tasks.

## 🚀 Features

- **Multimodal PDF Processing**: Extracts text from digital PDFs and leverages Gemini's reasoning for complex legal documents.
- **Legal RAG (Similarity Search)**: Integrates the **Supreme Court Judgments Dataset (1950-2024)** via ChromaDB. Automatically identifies and displays historical precedents relevant to the current case.
- **AI-Generated Strategic Action Plans**: Generates structured administrative tasks with deadlines, responsible departments, and confidence scores.
- **Text Sanitation Engine**: Automatically cleans malformed characters, curly quotes, and broken text for a professional output.
- **Risk & Urgency Scoring**: Rule-based engine that identifies "Contempt Triggers" and "Limitation Act" nuances to assign risk levels (CRITICAL, HIGH, MEDIUM).
- **Interactive Verification Page**: A high-fidelity dashboard for human-in-the-loop verification of extracted data and proposed plans.
- **Trusted View Dashboard**: A clean, premium executive view for decision-makers showing only approved action plans grouped by department.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI (Python 3.10+), Uvicorn.
- **AI Engine**: Google Gemini 1.5 Flash.
- **Vector Database**: ChromaDB (with `all-MiniLM-L6-v2` embeddings).
- **PDF Extraction**: PyMuPDF (`fitz`).

## 📥 Getting Started

### 1. Ingesting Historical Data
To populate the "Similar Cases" feature from your local archive:
```bash
cd backend_v2
python ingest_kaggle.py
```

### 2. Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- A Google Gemini API Key

### 3. Backend Setup (FastAPI)
```bash
cd backend_v2
pip install -r requirements.txt
```
Create a `.env` file in `backend_v2/`:
```env
GEMINI_API_KEY=your_key_here
PORT=8000
```
Run the server:
```bash
python main.py
```

### 4. Frontend Setup (React)
```bash
cd frontend
npm install
npm run dev
```

## 📂 Project Structure

- `frontend/`: React application with Vite.
  - `/trusted-view`: Exclusive dashboard for verified compliance data.
  - `/dashboard`: General matter tracking and status monitoring.
- `backend_v2/`: New Python FastAPI backend.
  - `modules/gemini.py`: Core AI logic with multimodal PDF support.
  - `modules/extractor.py`: PDF text extraction logic.
  - `modules/scoring.py`: Rule-based risk assessment engine.
- `backend/`: Original Node.js prototype (Legacy).

## 📊 Presentation & PPT Highlights (Slide Content)

Use these key points for your project presentation:

**Slide 1: The Problem**
- **Manual Overhead**: Legal teams spend hours manually parsing court judgments.
- **Risk of Overlook**: Critical deadlines and mandatory directives are often buried in 100+ page documents.
- **Lack of Precedent**: Hard to quickly find similar historical cases while reviewing a new judgment.

**Slide 2: Our Solution (Judgment2Action)**
- **Automated Extraction**: Uses Gemini AI to instantly pull structured data from PDFs.
- **Strategic Planning**: Transforms legal jargon into a clear "Action Plan" for administrators.
- **Precedent Integration**: Seamlessly links current judgments with 70 years of SC history.

**Slide 3: Core Workflow**
1. **Upload**: User uploads a PDF judgment.
2. **AI Extraction**: Gemini extracts directives, parties, and dates.
3. **Similarity Search**: ChromaDB finds the top 3 similar cases from 1950-2024.
4. **Risk Analysis**: Rule-based engine flags Contempt and Limitation Act risks.
5. **Human-in-the-Loop**: Dashboard allows users to verify and approve the final action plan.

**Slide 4: Technical Innovation**
- **Dual-Model Approach**: Combines Generative AI (Gemini) for extraction with Vector Embeddings (MiniLM) for RAG.
- **Scalability**: Python/FastAPI backend designed for high-concurrency document processing.
- **User-Centric Design**: React dashboard built for high-stakes decision making.

**Slide 5: Future Roadmap**
- Multi-language support for regional High Courts.
- Integration with government task management systems.
- Automated drafting of compliance reports.

## ⚖️ License
Internal Prototype - Official Use Only.
