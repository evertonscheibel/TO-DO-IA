require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const result = await genAI.listModels();
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
