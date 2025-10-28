
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in .env file');
}

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';

async function generate(prompt) {
    try {
        if (!prompt || prompt.trim().length === 0) {
            return '❌ Prompt cannot be empty';
        }

        const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            return '❌ No response from AI. Please try again.';
        }

        return text;
    } catch (err) {
        console.error('❌ Gemini API error:', err.message);
        
        if (err.message.includes('API key')) {
            return '❌ Invalid Gemini API key. Check your .env file.';
        } else if (err.message.includes('quota')) {
            return '❌ API quota exceeded. Please try again later.';
        } else if (err.message.includes('timeout')) {
            return '❌ Request timeout. Please try again.';
        }
        
        return '❌ Error processing request. Please try again later.';
    }
}

module.exports = { generate };

