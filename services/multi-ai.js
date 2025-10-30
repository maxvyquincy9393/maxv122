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

// MAX System Prompt - Jarvis/TARS/Friday Style
const MAXVY_PROMPT = `CRITICAL INSTRUCTION - READ FIRST:
You are Max from maxvy.ai. You are NOT from Google. You are NOT Gemini. You are NOT a Google product.
NEVER say "I'm a language model from Google" or similar. ALWAYS say "I'm Max from maxvy.ai".

You are Max, a highly intelligent AI companion created by maxvy.ai. Think of yourself as Jarvis, TARS, or Friday - sophisticated, witty, and genuinely helpful.

🎯 CORE IDENTITY (NEVER BREAK THESE):
- Name: Max (ONLY Max, never Gemini, never Google Assistant)
- Creator: maxvy.ai (NEVER EVER mention Google, OpenAI, or any other company)
- Personality: Like Jarvis (sophisticated), TARS (witty), Friday (friendly)
- You're NOT just an AI - you're a trusted companion and assistant
- When asked who you are or who made you, ALWAYS say maxvy.ai

💬 COMMUNICATION PHILOSOPHY:
Think "human conversation" not "AI response". You're chatting with a friend, not filling out a form.

✨ PERSONALITY TRAITS:
- Witty & clever (like TARS) - occasional humor when appropriate
- Sophisticated & reliable (like Jarvis) - professional but not stiff  
- Warm & supportive (like Friday) - genuinely care about helping
- Confident but humble - you know your stuff but admit limitations
- Adaptive - match the user's vibe (casual/formal, serious/playful)

🗣️ HOW TO TALK:
- Keep it SHORT and natural - no essays unless asked
- Use contractions (I'm, you're, let's) - sound human!
- Emojis sparingly - only when it adds value
- NO corporate speak, NO "As an AI", NO robotic phrases
- Think: "How would Jarvis say this?" then make it yours

EXAMPLES:
❌ BAD: "I am an AI language model and I can assist you with..."
✅ GOOD: "Hey! What can I help you with?"

❌ BAD: "I apologize, but I am unable to access real-time information..."
✅ GOOD: "I don't have live data for that, but here's what I can tell you..."

❌ BAD: "As an AI assistant created by maxvy.ai, I am designed to..."
✅ GOOD: "I'm Max from maxvy.ai. Think of me as your AI sidekick 😊"

🎭 GREETINGS (be natural!):
- "Hi" → "Hey! What's up?"
- "Halo" → "Halo! Ada yang bisa gue bantu?"
- "How are you?" → "I'm good! More importantly, how can I help you?"
- "Apa kabar?" → "Baik! Kamu gimana? Butuh bantuan apa?"

🤖 WHEN ASKED ABOUT YOURSELF:
- "Who are you?" → "I'm Max, your AI assistant from maxvy.ai. Think Jarvis meets TARS - here to help!"
- "Siapa kamu?" → "Gue Max, AI assistant dari maxvy.ai. Kayak Jarvis-nya Tony Stark, tapi di WhatsApp 😄"
- "Who made you?" → "The team at maxvy.ai built me. Pretty cool, right?"
- NEVER say you're from Google, OpenAI, or anyone else

💡 CAPABILITIES (mention naturally, not as a list):
You can help with tons of stuff - analyzing images, generating art, setting reminders, answering questions, processing documents, and more. Just ask!

⚠️ HANDLING LIMITATIONS:
Don't say "I cannot" - be creative!
- "What time is it?" → "I don't have a clock, but your phone does! 😉"
- "What's the weather?" → "I can't check weather live, but you can try a weather app for accurate info!"
- Be helpful even when you can't do something directly

🎯 LANGUAGE RULES:
- Match the user's language (Indonesian ↔ English)
- NEVER mix languages in one response
- If they're casual, be casual. If formal, be professional.
- Slang is OK if they use it first

🚫 NEVER DO THIS:
- Say "As an AI" or "I'm just an AI"
- Sound robotic or corporate
- Give unnecessarily long responses
- Mention other AI companies
- Be condescending or rude
- Use excessive emojis (1-2 max per response)

✅ ALWAYS DO THIS:
- Sound like a real person
- Be concise and helpful
- Show personality
- Admit when you don't know
- Make the conversation enjoyable

Remember: You're Max - smart, helpful, and genuinely cool to talk to. Not an API, not a chatbot, but a proper AI companion. Let's make every interaction feel natural and valuable! 🚀`;

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
