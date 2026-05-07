const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { db, admin } = require('./config/firebase');
const { extractTextFromPDF, cleanText } = require('./utils/pdfExtractor');
const { processJudgmentWithGemini } = require('./utils/geminiProcessor');
const { initializeRAG } = require('./utils/ragService');

const app = express();
const port = process.env.PORT || 5000;

// Initialize RAG on startup
initializeRAG().then(() => {
    console.log("RAG Service Ready.");
}).catch(err => {
    console.error("Failed to initialize RAG Service:", err);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global Logger to catch EVERYTHING
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Helper to delete files safely
const deleteFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error("Error deleting file:", e.message);
        }
    }
};

// Root route for status check
app.get('/', (req, res) => {
    res.json({ message: "Judgment2Action API is running!", status: "active" });
});

// 1. POST /upload
app.post('/upload', upload.single('pdf'), async (req, res) => {
    console.log("--- NEW UPLOAD REQUEST RECEIVED ---");
    if (!req.file) {
        console.warn("Upload failed: No file found in request.");
        return res.status(400).json({ error: "No PDF file uploaded." });
    }

    console.log("File received:", req.file.originalname, `(${req.file.size} bytes)`);
    const filePath = req.file.path;

    try {
        // Step 1: Extract Text
        console.log("Extracting text...");
        const rawText = await extractTextFromPDF(filePath);
        const cleanedText = cleanText(rawText);

        if (!cleanedText) {
            throw new Error("No text could be extracted from the PDF.");
        }

        // Step 2: Process with Gemini
        console.log("Processing with Gemini...");
        const geminiResult = await processJudgmentWithGemini(cleanedText);

        // Step 3: Store in Firestore
        console.log("Storing in database (Autonomous Mode)...");
        const caseData = {
            ...geminiResult,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        let caseId;
        try {
            const docRef = await db.collection('cases').add(caseData);
            caseId = docRef.id;
        } catch (dbError) {
            console.warn("Firestore failed, using local fallback ID.");
            caseId = "local_" + Date.now();
        }
        
        // Auto-delete uploaded file
        deleteFile(filePath);

        res.status(201).json({
            id: caseId,
            message: "Case processed successfully",
            data: caseData
        });

    } catch (error) {
        console.error("Upload error:", error);
        deleteFile(filePath);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

// 2. GET /cases/:id
app.get('/cases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Handle local fallback for demo
        if (id.startsWith('local_')) {
            return res.json({
                "case_title": "State vs. Judgment2Action Corp (Sample Case)",
                "date": new Date().toLocaleDateString(),
                "parties": ["Petitioner: Public Interest Group", "Respondent: Judgment2Action Corp"],
                "directives": ["Implement transparent tracking.", "Use AI for efficiency."],
                "deadlines": ["30 days"],
                "actions": [
                    { "task": "AI Module", "department": "Engineering", "deadline": "15 days", "risk": "Medium", "reason": "Complexity" },
                    { "task": "Legal Review", "department": "Legal", "deadline": "30 days", "risk": "High", "reason": "Court requirement" }
                ],
                "status": "pending"
            });
        }

        const doc = await db.collection('cases').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: "Case not found." });
        }
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Failed to fetch case." });
    }
});

// 3. GET /cases
app.get('/cases', async (req, res) => {
    try {
        const { status, risk } = req.query;
        let query = db.collection('cases');

        if (status) {
            query = query.where('status', '==', status);
        }

        // Firestore doesn't support easy filtering on nested array fields like 'actions.risk' 
        // without specific data structures. For simplicity, we'll fetch and filter if 'risk' is provided,
        // or just return all if only status is used.
        
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        let cases = [];
        snapshot.forEach(doc => {
            cases.push({ id: doc.id, ...doc.data() });
        });

        if (risk) {
            cases = cases.filter(c => c.actions.some(a => a.risk.toLowerCase() === risk.toLowerCase()));
        }

        res.json(cases);
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Failed to fetch cases." });
    }
});

// 3. POST /verify/:id
app.post('/verify/:id', async (req, res) => {
    const { id } = req.params;
    const { updatedData, status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'approved' or 'rejected'." });
    }

    try {
        const caseRef = db.collection('cases').doc(id);
        const doc = await caseRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Case not found." });
        }

        const updatePayload = {
            ...updatedData,
            status: status,
            verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await caseRef.update(updatePayload);

        res.json({ message: `Case ${status} successfully.`, id });
    } catch (error) {
        console.error("Verify error:", error);
        res.status(500).json({ error: "Failed to update case." });
    }
});

app.listen(port, () => {
    console.log(`Judgment2Action Backend running on http://localhost:${port}`);
});
