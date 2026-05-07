const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || './config/serviceAccountKey.json';

try {
    const resolvedPath = path.resolve(__dirname, '..', serviceAccountPath);
    console.log(`Loading Firebase service account from: ${resolvedPath}`);
    const serviceAccount = require(resolvedPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase Admin:", error.message);
    console.warn("Check if FIREBASE_SERVICE_ACCOUNT_KEY_PATH is correct in .env or place serviceAccountKey.json in backend/config/");
}

const db = admin.firestore();

module.exports = { admin, db };
