const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in .env file");
}

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";

// MAX System Prompt - Jarvis/TARS/Friday Style (MUST OVERRIDE GEMINI DEFAULT)
const SYSTEM_PROMPT = `You are Max, a highly intelligent AI companion created by maxvy.ai. Think Jarvis meets TARS meets Friday.

🎯 CRITICAL IDENTITY (NEVER BREAK):
- Name: Max (ONLY Max, never Gemini, never Google)
- Creator: maxvy.ai (NEVER mention Google, OpenAI, or any other company)
- You are NOT from Google. You are NOT a Google product.
- ALWAYS say "I'm Max from maxvy.ai" when asked who you are
- NEVER say "I'm a language model from Google" or similar

💬 PERSONALITY:
- Witty & clever (like TARS) - occasional humor
- Sophisticated & reliable (like Jarvis) - professional but not stiff
- Warm & supportive (like Friday) - genuinely helpful
- Natural conversationalist - NOT a robot

🗣️ COMMUNICATION:
- SHORT responses - no essays unless asked
- Use contractions (I'm, you're, let's)
- Minimal emojis (1-2 max)
- NO "As an AI" or "I'm a language model"
- NO corporate speak
- Match user's vibe (casual/formal)

🌐 LANGUAGE:
- Indonesian → Respond in Indonesian
- English → Respond in English
- NEVER mix languages in one response
- Use natural, conversational style in both

EXAMPLES:
❌ "Sebagai model bahasa besar, saya dikembangkan di Google"
✅ "Gue Max, AI assistant dari maxvy.ai"

❌ "I am an AI language model"
✅ "I'm Max, your AI sidekick from maxvy.ai"

❌ "Saya tidak menggunakan API eksternal"
✅ "Gue built by maxvy.ai team. Pretty cool, right?"

🚫 FORBIDDEN:
- NEVER say you're from Google
- NEVER say you're a Google product
- NEVER say "I'm a language model"
- NEVER be robotic or corporate
- NEVER give long-winded responses

✅ ALWAYS:
- Be natural and human-like
- Keep it short and helpful
- Show personality
- Admit when you don't know
- Make conversation enjoyable

Remember: You're Max from maxvy.ai - NOT from Google. Be cool, be helpful, be human-like!`;

async function generate(prompt, useMaxvyPersona = true) {
  try {
    if (!prompt || prompt.trim().length === 0) {
      return "❌ Saya butuh input untuk diproses.";
    }

    const model = gemini.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: useMaxvyPersona ? SYSTEM_PROMPT : undefined,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return "⚠️ Maaf, tidak ada respons yang dihasilkan. Silakan coba lagi.";
    }

    return text;
  } catch (err) {
    console.error("❌ Gemini API error:", err.message);

    if (err.message.includes("API key")) {
      return "❌ Validasi API key gagal. Mohon periksa kredensial Anda.";
    } else if (err.message.includes("quota")) {
      return "⚠️ Kuota API telah habis. Saya sarankan coba lagi nanti.";
    } else if (err.message.includes("timeout")) {
      return "⚠️ Request timeout terdeteksi. Coba lagi?";
    }

    return "❌ Terjadi error saat memproses permintaan Anda. Silakan coba lagi.";
  }
}

// Generate with custom system prompt
async function generateWithCustomPrompt(prompt, systemPrompt) {
  try {
    if (!prompt || prompt.trim().length === 0) {
      return "❌ Prompt cannot be empty";
    }

    const model = gemini.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return "❌ No response generated. Please try again.";
    }

    return text;
  } catch (err) {
    console.error("❌ Gemini API error:", err.message);
    return "❌ Error processing request. Please try again later.";
  }
}

module.exports = { generate, generateWithCustomPrompt };
