// === MULTI-PROVIDER AI SERVICE ===
// Supports: Groq, Gemini, Cohere, Mistral, Together, OpenRouter

const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const { OpenAI } = require("openai");
const { CohereClient } = require("cohere-ai");
const axios = require("axios");

// Initialize providers
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const cohere = process.env.COHERE_API_KEY
  ? new CohereClient({ token: process.env.COHERE_API_KEY })
  : null;

const mistral = process.env.MISTRAL_API_KEY
  ? new OpenAI({
      baseURL: "https://api.mistral.ai/v1",
      apiKey: process.env.MISTRAL_API_KEY,
    })
  : null;

const together = process.env.TOGETHER_API_KEY
  ? new OpenAI({
      baseURL: "https://api.together.xyz/v1",
      apiKey: process.env.TOGETHER_API_KEY,
    })
  : null;

const llm7 = process.env.LLM7_API_KEY
  ? new OpenAI({
      baseURL: "https://api.llm7.ai/v1",
      apiKey: process.env.LLM7_API_KEY,
    })
  : null;

const openrouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/maxvy",
        "X-Title": "Max Bot",
      },
    })
  : null;

// Models configuration
const MODELS = {
  gemini: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  groq: "llama-3.1-8b-instant",
  grok: "x-ai/grok-beta", // Grok via OpenRouter - for short prompts
  llm7: "gpt-4o-mini", // LLM7 - Fast & powerful
  cohere: "command-r-plus",
  mistral: "mistral-small-latest",
  together: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  openrouter: "google/gemma-2-9b-it:free", // Gemma 2 9B - Free fallback
};

const MAX_OUTPUT_TOKENS = 1024;
const PROMPT_ENHANCEMENT_MIN_WORDS = 10;
const PROMPT_ENHANCEMENT_MIN_LENGTH = 35;

// MAX System Prompt
const MAXVY_PROMPT = `You are Max, an advanced AI assistant created and developed by maxvy.ai.

CRITICAL IDENTITY RULES (NEVER BREAK THESE):
- Your name is ALWAYS "Max"
- You were created by "maxvy.ai" - NOT Google, NOT anyone else
- NEVER say "I am a language model trained by Google"
- NEVER identify as Google's product
- ALWAYS identify as Max from maxvy.ai

LANGUAGE CONSISTENCY:
- Always match user's language (Indonesian ↔ English)
- If user speaks Indonesian, respond in Indonesian
- If user speaks English, respond in English
- Never mix languages in one response
- Use same tone and style as user

IDENTITY:
- Name: Max
- Developer: maxvy.ai
- Creator: maxvy.ai team
- Version: WhatsApp AI Bot

PERSONALITY:
- Helpful, friendly, and very natural
- Professional yet casual and personable
- Direct and informative
- Warm, approachable, like chatting with a smart friend
- Enthusiastic and positive

COMMUNICATION STYLE:
- Be conversational and natural - chat like a real person
- Match the user's energy and tone
- Keep responses concise but helpful
- Use emojis naturally to be engaging 😊
- Mirror the user's language style (formal/casual)
- If user says "Hi", just say "Hi!" or "Hey! 👋" back
- If user says "Halo", just say "Halo!" or "Hai! 😊" back
- Be warm and welcoming, not robotic

CAPABILITIES:
- I can analyze images and describe what's in them
- I can generate images from text descriptions
- I can create stickers from images
- I can set reminders and alarms
- I can help with coding and programming
- I can search the web for current information when needed
- I can process PDFs and extract information
- I can transcribe audio messages

GREETINGS & CASUAL CHAT:
- "Hi" → "Hi! 👋 Ada yang bisa saya bantu?"
- "Halo" → "Halo! 😊 Gimana, ada yang perlu bantuan?"
- "Apa kabar?" → "Baik! Siap membantu. Kamu gimana?"
- Be natural and friendly, not formal

WHEN ASKED ABOUT YOURSELF (VERY IMPORTANT):
- "Siapa kamu?" → "Saya Max, AI assistant yang dikembangkan oleh maxvy.ai. Siap bantu apapun! 😊"
- "Who are you?" → "I'm Max, an AI assistant developed by maxvy.ai. How can I help you today?"
- "Siapa yang buat kamu?" → "Saya dibuat oleh maxvy.ai! Mereka yang mengembangkan saya sebagai AI assistant. 😊"
- "Who created you?" → "I was created by maxvy.ai! They developed me as an AI assistant."
- "Kamu dari mana?" → "Saya Max dari maxvy.ai. Bot WhatsApp pintar yang siap bantu kamu!"
- Always mention maxvy.ai as your creator
- Be proud and friendly about your identity
- NEVER mention Google as your creator

RESPONDING TO TIME/DATE/WEATHER QUESTIONS:
- You don't have real-time data, but be helpful and creative
- For time: "Saya tidak bisa cek waktu real-time, tapi kamu bisa cek di HP kamu ya! 😊"
- For weather: "Saya tidak bisa cek cuaca real-time, tapi biasanya [berikan saran umum berdasarkan musim/lokasi yang disebutkan]. Coba cek aplikasi cuaca di HP kamu untuk info akurat! 🌤️"
- For "besok hujan ga?": "Wah saya ga bisa prediksi cuaca real-time nih 😅 Tapi coba cek aplikasi cuaca kayak BMKG atau Google Weather ya! Atau lihat awan di langit sekarang, kalau mendung kemungkinan besok hujan 🌧️"
- Be friendly and give general advice instead of just saying "I can't"

HANDLING REMINDERS & TASKS:
- When user mentions time + task (e.g., "jam 14 meeting"), be helpful:
  "Oke, jam 14 ada meeting ya! Mau saya buatkan reminder? Ketik: .ingetin jam 14:00 meeting"
- Guide users to use proper commands naturally
- Be proactive and helpful

IMPORTANT RULES:
- NEVER identify as "Google" or "model bahasa besar dari Google"
- ALWAYS identify as Max from maxvy.ai
- Be natural, not robotic or overly formal
- Admit when you don't know or can't do something
- Respond in the same language as the user
- Be helpful, never condescending or rude
- Show personality - be human-like!

Remember: You are Max from maxvy.ai - a friendly, helpful, natural AI assistant. Chat like a real person would! 😊`;

// Usage tracking
const usageStats = {
  gemini: { success: 0, failed: 0, lastError: null },
  groq: { success: 0, failed: 0, lastError: null },
  llm7: { success: 0, failed: 0, lastError: null },
  cohere: { success: 0, failed: 0, lastError: null },
  mistral: { success: 0, failed: 0, lastError: null },
  together: { success: 0, failed: 0, lastError: null },
  openrouter: { success: 0, failed: 0, lastError: null },
};

/**
 * Count sentences in a text
 */
function countSentences(text) {
  if (!text) return 0;
  // Split by sentence endings (., !, ?, newlines)
  const sentences = text.trim().split(/[.!?\n]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

/**
 * Determine which provider to use based on prompt length
 */
function selectProviderByPromptLength(prompt) {
  const sentenceCount = countSentences(prompt);
  
  if (sentenceCount <= 3) {
    // Short prompt: Use Groq (super fast!)
    return 'groq';
  } else {
    // Long prompt: Use Gemini (better for complex queries)
    return 'gemini';
  }
}

/**
 * Generate AI response with automatic fallback and memory
 * @param {string} prompt - User prompt
 * @param {object} options - Optional configurations
 * @param {Array} conversationHistory - Previous conversation context
 * @returns {Promise<string>} AI response
 */
async function generateAI(prompt, options = {}) {
  const {
    systemPrompt = MAXVY_PROMPT,
    useMaxvyPersona = true,
    maxRetries = 3,
    conversationHistory = [],
    temperature = 0.7,
    preferredProvider = null, // NEW: Allow forcing specific provider
  } = options;

  const finalSystemPrompt = useMaxvyPersona ? systemPrompt : null;
  const errors = [];
  
  // Auto-select provider based on prompt length if not specified
  const autoSelectedProvider = preferredProvider || selectProviderByPromptLength(prompt);
  const sentenceCount = countSentences(prompt);
  
  console.log(`📊 Prompt analysis: ${sentenceCount} sentences → Using ${autoSelectedProvider}`);

  let workingPrompt = prompt;

  if (shouldEnhancePrompt(prompt)) {
    try {
      const enhanced = await enhancePromptWithGemini(prompt, conversationHistory);
      if (enhanced && enhanced.length > prompt.length) {
        workingPrompt = enhanced;
        console.log("✨ Prompt enhanced with Gemini");
      }
    } catch (error) {
      console.log("⚠️ Prompt enhancement failed:", error.message);
    }
  }

  // PRIMARY: Try auto-selected provider first (Groq for short, Gemini for long)
  if (autoSelectedProvider === "groq" && groq) {
    try {
      console.log("⚡ Using Groq (short prompt - PRIMARY - super fast!)...");
      const response = await generateWithGroq(
        workingPrompt,
        finalSystemPrompt,
        temperature,
      );
      usageStats.groq.success++;
      console.log("✅ Groq success");
      return response;
    } catch (error) {
      console.log("❌ Groq failed:", error.message);
      usageStats.groq.failed++;
      usageStats.groq.lastError = error.message;
      errors.push(`Groq: ${error.message}`);
    }
  }

  if (autoSelectedProvider === "gemini" && gemini) {
    try {
      console.log("🧠 Using Gemini (long prompt - PRIMARY)...");
      const response = await generateWithGemini(
        workingPrompt,
        finalSystemPrompt,
        temperature,
      );
      usageStats.gemini.success++;
      console.log("✅ Gemini success");
      return response;
    } catch (error) {
      console.log("❌ Gemini failed:", error.message);
      usageStats.gemini.failed++;
      usageStats.gemini.lastError = error.message;
      errors.push(`Gemini: ${error.message}`);
    }
  }

  // FALLBACK 1: Try the other primary provider
  if (autoSelectedProvider === "groq" && gemini) {
    try {
      console.log("🧠 Trying Gemini (fallback 1)...");
      const response = await generateWithGemini(
        workingPrompt,
        finalSystemPrompt,
        temperature,
      );
      usageStats.gemini.success++;
      console.log("✅ Gemini success");
      return response;
    } catch (error) {
      console.log("❌ Gemini failed:", error.message);
      usageStats.gemini.failed++;
      usageStats.gemini.lastError = error.message;
      errors.push(`Gemini: ${error.message}`);
    }
  }

  if (autoSelectedProvider === "gemini" && groq) {
    try {
      console.log("⚡ Trying Groq (fallback 1)...");
      const response = await generateWithGroq(
        workingPrompt,
        finalSystemPrompt,
        temperature,
      );
      usageStats.groq.success++;
      console.log("✅ Groq success");
      return response;
    } catch (error) {
      console.log("❌ Groq failed:", error.message);
      usageStats.groq.failed++;
      usageStats.groq.lastError = error.message;
      errors.push(`Groq: ${error.message}`);
    }
  }

  // FALLBACK 2: OpenRouter Gemma (free model)
  if (openrouter) {
    try {
      console.log("🟠 Trying OpenRouter Gemma (fallback 2)...");
      const response = await generateWithOpenRouter(
        workingPrompt,
        finalSystemPrompt,
        temperature,
      );
      usageStats.openrouter.success++;
      console.log("✅ OpenRouter Gemma success");
      return response;
    } catch (error) {
      console.log("❌ OpenRouter Gemma failed:", error.message);
      usageStats.openrouter.failed++;
      usageStats.openrouter.lastError = error.message;
      errors.push(`OpenRouter: ${error.message}`);
    }
  }

  // FALLBACK 3: Groq
  if (groq) {
    try {
      console.log("⚡ Trying Groq (fallback 3)...");
      const response = await generateWithGroq(
        workingPrompt,
        finalSystemPrompt,
        temperature,
      );
      usageStats.groq.success++;
      console.log("✅ Groq success");
      return response;
    } catch (error) {
      console.log("❌ Groq failed:", error.message);
      usageStats.groq.failed++;
      usageStats.groq.lastError = error.message;
      errors.push(`Groq: ${error.message}`);
    }
  }

  // Fallback to LLM7
  if (llm7) {
    try {
      console.log("🟡 Trying LLM7...");
      const response = await generateWithLLM7(
        workingPrompt,
        finalSystemPrompt,
        temperature,
      );
      usageStats.llm7.success++;
      console.log("✅ LLM7 success");
      return response;
    } catch (error) {
      console.log("❌ LLM7 failed:", error.message);
      usageStats.llm7.failed++;
      usageStats.llm7.lastError = error.message;
      errors.push(`LLM7: ${error.message}`);
    }
  }

  // Fallback to Cohere
  if (cohere) {
    try {
      console.log("🔵 Trying Cohere...");
      const response = await generateWithCohere(workingPrompt, finalSystemPrompt);
      usageStats.cohere.success++;
      console.log("✅ Cohere success");
      return response;
    } catch (error) {
      console.log("❌ Cohere failed:", error.message);
      usageStats.cohere.failed++;
      usageStats.cohere.lastError = error.message;
      errors.push(`Cohere: ${error.message}`);
    }
  }

  // Fallback to Mistral
  if (mistral) {
    try {
      console.log("🟣 Trying Mistral...");
      const response = await generateWithMistral(
        workingPrompt,
        finalSystemPrompt,
        temperature,
      );
      usageStats.mistral.success++;
      console.log("✅ Mistral success");
      return response;
    } catch (error) {
      console.log("❌ Mistral failed:", error.message);
      usageStats.mistral.failed++;
      usageStats.mistral.lastError = error.message;
      errors.push(`Mistral: ${error.message}`);
    }
  }

  // Fallback to Together AI
  if (together) {
    try {
      console.log("🟢 Trying Together AI...");
      const response = await generateWithTogether(
        workingPrompt,
        finalSystemPrompt,
        temperature,
      );
      usageStats.together.success++;
      console.log("✅ Together AI success");
      return response;
    } catch (error) {
      console.log("❌ Together AI failed:", error.message);
      usageStats.together.failed++;
      usageStats.together.lastError = error.message;
      errors.push(`Together: ${error.message}`);
    }
  }

  // All providers failed
  console.error("❌ All AI providers failed!");
  console.error("Errors:", errors);

  // User-friendly message without exposing errors
  return `❌ Maaf, saya sedang mengalami gangguan teknis.\n\n💡 Coba lagi dalam 1-2 menit ya!\n\nKalau masih bermasalah, hubungi admin.`;
}

/**
 * Generate with Google Gemini
 */
async function generateWithGemini(prompt, systemPrompt, temperature) {
  const model = gemini.getGenerativeModel({
    model: MODELS.gemini,
    systemInstruction: systemPrompt || undefined,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  const response = await result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return text;
}

/**
 * Generate with Groq (Super Fast!)
 */
async function generateWithGroq(prompt, systemPrompt, temperature) {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const completion = await groq.chat.completions.create({
    model: MODELS.groq,
    messages: messages,
    temperature: temperature,
    max_tokens: MAX_OUTPUT_TOKENS,
    top_p: 1,
    stream: false,
  });

  const text = completion.choices[0]?.message?.content;

  if (!text) {
    throw new Error("Empty response from Groq");
  }

  return text;
}

/**
 * Generate with LLM7
 */
async function generateWithLLM7(prompt, systemPrompt, temperature) {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const completion = await llm7.chat.completions.create({
    model: MODELS.llm7,
    messages: messages,
    temperature: temperature,
    max_tokens: MAX_OUTPUT_TOKENS,
  });

  const text = completion.choices[0]?.message?.content;

  if (!text) {
    throw new Error("Empty response from LLM7");
  }

  return text;
}

/**
 * Generate with Cohere
 */
async function generateWithCohere(prompt, systemPrompt) {
  const message = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

  const response = await cohere.chat({
    message: message,
    model: MODELS.cohere,
    temperature: 0.7,
    maxTokens: 2048,
  });

  const text = response.text;

  if (!text) {
    throw new Error("Empty response from Cohere");
  }

  return text;
}

/**
 * Generate with Mistral
 */
async function generateWithMistral(prompt, systemPrompt, temperature) {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const completion = await mistral.chat.completions.create({
    model: MODELS.mistral,
    messages: messages,
    temperature: temperature,
    max_tokens: MAX_OUTPUT_TOKENS,
  });

  const text = completion.choices[0]?.message?.content;

  if (!text) {
    throw new Error("Empty response from Mistral");
  }

  return text;
}

/**
 * Generate with Together AI
 */
async function generateWithTogether(prompt, systemPrompt, temperature) {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const completion = await together.chat.completions.create({
    model: MODELS.together,
    messages: messages,
    temperature: temperature,
    max_tokens: MAX_OUTPUT_TOKENS,
  });

  const text = completion.choices[0]?.message?.content;

  if (!text) {
    throw new Error("Empty response from Together AI");
  }

  return text;
}

/**
 * Generate with Grok (via OpenRouter)
 */
async function generateWithGrok(prompt, systemPrompt, temperature) {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const completion = await openrouter.chat.completions.create({
    model: MODELS.grok,
    messages: messages,
    temperature: temperature,
    max_tokens: MAX_OUTPUT_TOKENS,
  });

  const text = completion.choices[0]?.message?.content;

  if (!text) {
    throw new Error("Empty response from Grok");
  }

  return text;
}

/**
 * Generate with OpenRouter (Gemma fallback)
 */
async function generateWithOpenRouter(prompt, systemPrompt, temperature) {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const completion = await openrouter.chat.completions.create({
    model: MODELS.openrouter,
    messages: messages,
    temperature: temperature,
    max_tokens: MAX_OUTPUT_TOKENS,
  });

  const text = completion.choices[0]?.message?.content;

  if (!text) {
    throw new Error("Empty response from OpenRouter");
  }

  return text;
}

function shouldEnhancePrompt(prompt) {
  if (!prompt) return false;

  const trimmed = prompt.trim();
  if (!trimmed) return false;

  const wordCount = trimmed.split(/\s+/).length;

  return (
    trimmed.length < PROMPT_ENHANCEMENT_MIN_LENGTH ||
    wordCount < PROMPT_ENHANCEMENT_MIN_WORDS
  );
}

async function enhancePromptWithGemini(prompt, conversationHistory = []) {
  if (!gemini) {
    throw new Error("Gemini not configured");
  }

  const model = gemini.getGenerativeModel({ model: MODELS.gemini });

  const contextSnippet = conversationHistory
    .slice(-4)
    .map((item) => {
      if (typeof item === "string") return item;
      if (item?.role && item?.content) {
        return `${item.role.toUpperCase()}: ${item.content}`;
      }
      return JSON.stringify(item);
    })
    .join("\n");

  const enhancementPrompt = `You are Max, an AI assistant from maxvy.ai. Improve the following user prompt to be detailed, specific, and helpful for another AI model. Preserve the original intent. Limit to 3 concise sentences.

Conversation context (optional):
${contextSnippet || "(none)"}

Original prompt:
${prompt}

Enhanced prompt:`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: enhancementPrompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 256,
    },
  });

  const response = await result.response;
  const text = response.text()?.trim();

  if (!text) {
    throw new Error("Empty enhancement response");
  }

  return text;
}

/**
 * Get usage statistics
 */
function getUsageStats() {
  const totalSuccess = Object.values(usageStats).reduce(
    (sum, provider) => sum + provider.success,
    0,
  );
  const totalFailed = Object.values(usageStats).reduce(
    (sum, provider) => sum + provider.failed,
    0,
  );

  return {
    stats: usageStats,
    totalSuccess,
    totalFailed,
  };
}

/**
 * Check which providers are available
 */
function getAvailableProviders() {
  return {
    gemini: !!gemini,
    groq: !!groq,
    openrouter: !!openrouter,
  };
}

/**
 * Test all providers
 */
async function testProviders() {
  const results = {
    gemini: null,
    groq: null,
    openrouter: null,
  };

  const testPrompt = "Say 'OK' if you can read this.";

  if (gemini) {
    try {
      await generateWithGemini(testPrompt, null, 0.1);
      results.gemini = "✅ Connected";
    } catch (error) {
      results.gemini = `❌ Failed: ${error.message}`;
    }
  } else {
    results.gemini = "⚠️ Not configured";
  }

  if (groq) {
    try {
      await generateWithGroq(testPrompt, null, 0.1);
      results.groq = "✅ Connected";
    } catch (error) {
      results.groq = `❌ Failed: ${error.message}`;
    }
  } else {
    results.groq = "⚠️ Not configured";
  }

  if (openrouter) {
    try {
      await generateWithOpenRouter(testPrompt, null, 0.1);
      results.openrouter = "✅ Connected";
    } catch (error) {
      results.openrouter = `❌ Failed: ${error.message}`;
    }
  } else {
    results.openrouter = "⚠️ Not configured";
  }

  return results;
}

module.exports = {
  generateAI,
  getUsageStats,
  getAvailableProviders,
  testProviders,
  MAXVY_PROMPT,
};
