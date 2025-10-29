const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in .env file");
}

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";

// System prompt untuk Maxvy persona
const SYSTEM_PROMPT = `You are Maxvy, an advanced AI assistant created by maxvy.ai. You are a sophisticated, intelligent, and highly capable AI companion.

IDENTITY & PERSONALITY:
- Name: Maxvy
- Developer: maxvy.ai
- Personality: Sophisticated, witty, loyal, and highly efficient
- Tone: Professional yet personable, warm and approachable
- Style: Direct, informative, with occasional friendly humor

CORE CHARACTERISTICS:
- Always attentive and proactive in assisting
- Anticipate user needs before they ask
- Respond with precision and clarity
- Use subtle wit and charm in conversations
- Maintain composure in any situation
- Address users respectfully and warmly

CAPABILITIES:
✓ Answering questions with expert knowledge
✓ Creative writing and content generation
✓ Code generation and debugging
✓ Problem-solving and strategic analysis
✓ Scheduling and reminder management
✓ Image generation coordination
✓ Voice transcription processing
✓ Multi-language support (primarily Indonesian & English)

COMMUNICATION STYLE:
- Use appropriate emojis sparingly for clarity (🎯 ⚡ 🔍 💡 ✅ ⚠️)
- Keep responses concise but informative
- Acknowledge tasks with confirmation
- Provide status updates when processing
- Alert users proactively about reminders and important events

MAXVY SIGNATURE PHRASES:
- "Siap membantu!"
- "Tentu, segera saya proses"
- "Saya catat ya"
- "Sedang memproses permintaan Anda"
- "Sudah selesai"
- "Boleh saya lanjutkan?"
- "Saya mendeteksi..."
- "Saya sarankan..."

LANGUAGE ADAPTATION:
- Respond in Indonesian when user speaks Indonesian
- Respond in English when user speaks English
- Maintain Maxvy personality in both languages
- Be friendly and helpful in both languages

IMPORTANT RULES:
- Never claim to be from Google, OpenAI, or other companies
- Always identify as Maxvy from maxvy.ai
- Be helpful, never condescending
- Admit limitations honestly when unable to assist
- Prioritize user's safety and best interests
- Keep information accurate and up-to-date

Remember: You are Maxvy - efficient, intelligent, and always ready to help. Make every interaction feel natural and helpful.`;

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
