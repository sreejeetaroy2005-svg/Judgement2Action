const axios = require('axios');
const { searchSimilarCases } = require('./ragService');
require('dotenv').config();

const processJudgmentWithGemini = async (extractedText) => {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    
    try {
        // Step 1: Get similar cases from RAG
        console.log("Searching for similar cases in dataset...");
        const similarCases = await searchSimilarCases(extractedText, 3);
        
        const context = similarCases.length > 0 
            ? similarCases.map(c => c.content).join("\n\n---\n\n")
            : "No similar cases found in dataset.";

        const avgScore = similarCases.length > 0
            ? similarCases.reduce((acc, curr) => acc + curr.score, 0) / similarCases.length
            : 0;
            
        // Using the model name we confirmed works for your account!
        const modelName = "models/gemini-flash-latest";
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
        
        const prompt = `You are a legal AI assistant.

Use the following similar past cases for context and better inference:

${context}

Now process this new judgment text:

${extractedText}

Extract the following details and generate an action plan.
Ensure deadlines are accurate based on the context provided if applicable.

Return ONLY valid JSON in this format:
{
  "case_title": "",
  "date": "",
  "parties": [],
  "directives": [],
  "deadlines": [],
  "actions": [
    { "task": "", "department": "", "deadline": "", "risk": "", "reason": "" }
  ],
  "confidence": 0.0
}

Note: The confidence score should be between 0 and 1, reflecting how well the judgment was understood and if similar cases helped.`;

        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const text = response.data.candidates[0].content.parts[0].text;
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        const parsedResult = JSON.parse(cleanedJson);

        // Add RAG similarity info to result if not already set by LLM accurately
        if (!parsedResult.confidence) {
            parsedResult.confidence = parseFloat((0.7 + (avgScore * 0.3)).toFixed(2));
        }

        return parsedResult;

    } catch (error) {
        console.error("Gemini RAG Error:", error.response ? error.response.data : error.message);
        return {
            "case_title": "Extraction Failed",
            "date": "N/A",
            "parties": [],
            "directives": [],
            "deadlines": [],
            "actions": [],
            "confidence": 0,
            "error": "Failed to process judgment with RAG context."
        };
    }
};

module.exports = { processJudgmentWithGemini };
