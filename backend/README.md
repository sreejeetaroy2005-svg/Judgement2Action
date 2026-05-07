# Judgment2Action Backend

This is the Node.js/Express backend for the Judgment2Action project.

## Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configuration**:
   - Create a `.env` file in the `backend` directory (one has been created with placeholders).
   - Add your `GEMINI_API_KEY`.
   - Place your Firebase Service Account JSON file in `backend/config/serviceAccountKey.json`.

3. **Run the Server**:
   ```bash
   node server.js
   ```

## API Endpoints

### 1. `POST /upload`
- **Description**: Upload a court judgment PDF to extract text and generate an action plan using Gemini.
- **Body**: `multipart/form-data` with a `pdf` file field.
- **Returns**: Stored document ID and the processed JSON data.

### 2. `GET /cases`
- **Description**: Fetch all processed cases.
- **Query Params**:
  - `status`: Filter by `pending`, `approved`, or `rejected`.
  - `risk`: Filter by `High`, `Medium`, or `Low`.

### 3. `POST /verify/:id`
- **Description**: Approve or reject a case and update its data.
- **Body**:
  ```json
  {
    "status": "approved",
    "updatedData": { ... }
  }
  ```

## Features
- **OCR Fallback**: Automatically uses Tesseract.js if the PDF is scanned or has no selectable text.
- **AI Processing**: Uses Gemini 1.5 Flash for legal document analysis.
- **Auto-Cleanup**: Uploaded files are deleted immediately after processing.
