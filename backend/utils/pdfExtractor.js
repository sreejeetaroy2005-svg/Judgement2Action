const pdf = require('pdf-parse-fork');
const Tesseract = require('tesseract.js');
const fs = require('fs');

const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        
        // Simple and direct call with the fork
        const data = await pdf(dataBuffer);
        
        let extractedText = data.text.trim();

        // If text is too short or empty, fallback to OCR
        if (extractedText.length < 50) {
            console.log("Extracted text too short, falling back to OCR...");
            const { data: { text } } = await Tesseract.recognize(
                filePath,
                'eng',
                { logger: m => console.log(m) }
            );
            extractedText = text.trim();
        }

        return extractedText;
    } catch (error) {
        console.error("--- PDF EXTRACTION CRASHED ---");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Stack Trace:", error.stack);
        throw new Error(`PDF Extraction failed: ${error.message}`);
    }
};

const cleanText = (text) => {
    // Basic cleaning: remove extra whitespace, handle common OCR artifacts
    return text.replace(/\s+/g, ' ').trim();
};

module.exports = { extractTextFromPDF, cleanText };
