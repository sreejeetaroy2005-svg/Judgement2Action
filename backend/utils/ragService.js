const fs = require('fs');
const path = require('path');
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { Document } = require("@langchain/core/documents");
require('dotenv').config();

let vectorStore = null;

/**
 * Initializes the vector store with the dataset.
 */
const initializeRAG = async () => {
    try {
        const datasetPath = path.join(__dirname, '../data/legal_dataset.json');
        
        if (!fs.existsSync(datasetPath)) {
            console.warn("Dataset not found at:", datasetPath);
            return;
        }

        const rawData = fs.readFileSync(datasetPath, 'utf8');
        const dataset = JSON.parse(rawData);

        const docs = dataset.map(entry => {
            const content = `Judgment: ${entry.judgment_text}\nAction: ${entry.action}\nDeadline: ${entry.deadline}\nOutcome: ${entry.outcome}`;
            return new Document({
                pageContent: content,
                metadata: entry
            });
        });

        const apiKey = (process.env.GEMINI_API_KEY || "").trim();
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing. RAG will not work.");
            return;
        }

        console.log("Generating embeddings and initializing vector store...");
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: apiKey,
            modelName: "embedding-001",
        });

        vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
        console.log("Vector store initialized successfully.");

    } catch (error) {
        console.error("Error initializing RAG:", error.message);
        if (error.message.includes("quota")) {
            console.error("Quota exceeded for embeddings API. Falling back to empty vector store.");
        }
    }
};

const searchSimilarCases = async (queryText, k = 3) => {
    if (!vectorStore) {
        console.warn("Vector store not initialized.");
        return [];
    }

    try {
        const results = await vectorStore.similaritySearchWithScore(queryText, k);
        return results.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score: score
        }));
    } catch (error) {
        console.error("Error during similarity search:", error.message);
        return [];
    }
};

module.exports = {
    initializeRAG,
    searchSimilarCases
};
