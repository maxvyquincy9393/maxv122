// === MAXVY v3.1 - Advanced AI Assistant Bot ===
// Author: maxvy.ai
// Bot Name: Max - Your AI Assistant

require("dotenv").config();

// Start health check server for Render deployment
const { setQRCode } = require("./health-server");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const {
  containsBadWords,
  isAbusiveUser,
} = require("./utils/helpers");
const pino = require("pino");
const axios = require("axios");
const sharp = require("sharp");
const moment = require("moment");
const chrono = require("chrono-node");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const cron = require("node-cron");
const FormData = require("form-data");

// Configuration
const PREFIXES = (process.env.BOT_PREFIXES || ".,!,/").split(",");
const ACTIVATION_CMD = process.env.ACTIVATION_COMMAND || "maxactivate";
const DEACTIVATION_CMD = process.env.DEACTIVATION_COMMAND || "maxdeactivate";

const CONFIG = {
  BOT_INFO: {
    VERSION: "3.1.0",
    NAME: "MAXVY",
    DEVELOPER: "maxvy.ai",
  },
  MEMORY: {
    CONTEXT_EXPIRY_MS: 3600000, // 1 hour
    MAX_HISTORY: 10,
  },
};

const uploadFileForLink = async (filePath) => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await fetch("https://file.io", {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.link) {
      throw new Error("Upload response missing link");
    }

    return data.link;
  } catch (error) {
    logger.error("❌ Upload error:", error.message);
    return null;
  }
};

const handleYtMp3Intent = async (intent, sender, msg) => {
  const url = intent.params?.url;

  if (!url) {
    return "❌ Format: /ytmp3 <link YouTube>. Contoh: /ytmp3 https://youtu.be/dQw4w9WgXcQ";
  }

  if (!isValidYouTubeUrl(url)) {
    return "❌ Link YouTube tidak valid. Pastikan format URL sudah benar.";
  }

  await sock.sendMessage(sender, {
    text: "🎧 Sedang menyiapkan audio dari YouTube, tunggu sebentar ya...",
  });

  let result = null;

  try {
    result = await downloadAndConvertToMp3(url);

    if (!result?.path) {
      throw new Error("Konversi gagal");
    }

    const stats = await fsPromises.stat(result.path);
    const fileSize = stats.size;
    const maxSize = 15 * 1024 * 1024; // 15 MB

    if (fileSize <= maxSize) {
      const audioBuffer = await fsPromises.readFile(result.path);

      await sock.sendMessage(sender, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        fileName: `${result.title}.mp3`,
      });

      removeFileSafe(result.path);

      return "✅ Berhasil! Lagu sudah dikirim dalam format MP3.";
    }

    const downloadLink = await uploadFileForLink(result.path);
    removeFileSafe(result.path);

    if (downloadLink) {
      return (
        "⚠️ File audionya lebih dari 15MB, jadi tidak bisa dikirim langsung.\n" +
        `📥 Silakan download di sini: ${downloadLink}`
      );
    }

    return "⚠️ File lebih dari 15MB dan gagal mengunggah link unduhan. Coba unduh manual lewat YouTube ya.";
  } catch (error) {
    logger.error("❌ YTMP3 handler error:", error.message || error);

    if (result?.path) {
      removeFileSafe(result.path);
    }

    return "❌ Maaf, gagal mengonversi video YouTube. Coba link lain atau ulangi nanti.";
  }
};

function parseNaturalTime(input, intervalOverrideMs = null, forceRecurring = false) {
  if (!input && !intervalOverrideMs) {
    return null;
  }

  let intervalMs = intervalOverrideMs || null;
  let intervalLabel = null;
  let isRecurring = forceRecurring || false;
  let nextTrigger = null;

  const ensureFuture = (momentObj) => {
    if (!momentObj || !momentObj.isValid()) return momentObj;
    if (momentObj.isBefore(moment())) {
      momentObj.add(1, "minute");
    }
    return momentObj;
  };

  if (input instanceof Date) {
    nextTrigger = moment(input);
  } else if (moment.isMoment?.(input)) {
    nextTrigger = input.clone();
  } else if (typeof input === "number") {
    nextTrigger = moment(input);
  } else if (typeof input === "string") {
    const normalized = input.trim();
    if (!normalized) {
      nextTrigger = null;
    } else {
      const recurringMatch = normalized.match(
        /(setiap|every)\s+(\d+)?\s*(detik|second|seconds?|menit|minute|minutes|jam|hour|hours?|hari|day|days)/i,
      );

      if (recurringMatch) {
        const count = parseInt(recurringMatch[2] || "1", 10);
        const unit = recurringMatch[3];
        const computedInterval = getIntervalMs(count, unit);

        if (computedInterval) {
          intervalMs = intervalMs || computedInterval;
          intervalLabel = formatIntervalLabel(count, unit);
          isRecurring = true;
        }
      }

      const chronoResult = chrono.parseDate(normalized, new Date(), {
        forwardDate: true,
      });

      if (chronoResult) {
        nextTrigger = moment(chronoResult);
      }
    }
  } else if (input && typeof input === "object" && input.start) {
    // Support chrono result objects
    nextTrigger = input.start?.date ? moment(input.start.date()) : null;
  }

  if ((!nextTrigger || !nextTrigger.isValid()) && intervalMs) {
    nextTrigger = moment().add(intervalMs, "milliseconds");
  }

  nextTrigger = ensureFuture(nextTrigger);

  if (!nextTrigger || !nextTrigger.isValid()) {
    return null;
  }

  if (intervalMs && !intervalLabel) {
    intervalLabel = formatIntervalFromMs(intervalMs);
  }

  return {
    nextTrigger,
    isRecurring: isRecurring || !!intervalMs,
    intervalMs: intervalMs || null,
    intervalLabel,
  };
}

function getIntervalMs(number, unitRaw) {
  const unit = unitRaw.startsWith("menit") || unitRaw.startsWith("minute")
    ? "minutes"
    : unitRaw.startsWith("jam") || unitRaw.startsWith("hour")
      ? "hours"
      : unitRaw.startsWith("detik") || unitRaw.startsWith("second")
        ? "seconds"
        : unitRaw.startsWith("hari") || unitRaw.startsWith("day")
          ? "days"
          : null;

  if (!unit) return null;

  const duration = moment.duration(number, unit);
  return duration.asMilliseconds();
}

function formatIntervalLabel(number, unitRaw) {
  const unit = unitRaw.toLowerCase();
  let unitId = "";

  if (unit.startsWith("detik") || unit.startsWith("second")) {
    unitId = "detik";
  } else if (unit.startsWith("menit") || unit.startsWith("minute")) {
    unitId = "menit";
  } else if (unit.startsWith("jam") || unit.startsWith("hour")) {
    unitId = "jam";
  } else if (unit.startsWith("hari") || unit.startsWith("day")) {
    unitId = "hari";
  } else {
    unitId = unit;
  }

  return `Setiap ${number} ${unitId}`;
}

function formatIntervalFromMs(intervalMs) {
  if (!intervalMs) return "Recurring";

  const duration = moment.duration(intervalMs);

  if (duration.asDays() >= 1 && Number.isInteger(duration.asDays())) {
    return `Setiap ${duration.asDays()} hari`;
  }

  if (duration.asHours() >= 1 && Number.isInteger(duration.asHours())) {
    return `Setiap ${duration.asHours()} jam`;
  }

  if (duration.asMinutes() >= 1 && Number.isInteger(duration.asMinutes())) {
    return `Setiap ${duration.asMinutes()} menit`;
  }

  if (duration.asSeconds() >= 1) {
    return `Setiap ${Math.max(1, Math.round(duration.asSeconds()))} detik`;
  }

  return "Recurring";
}

// Enhanced logging
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

// Storage
const { reminders, initStorage, saveData } = require("./storage");

// Services
const {
  generateAI,
  testProviders: testAIProviders,
} = require("./services/multi-ai");
const {
  transcribeAudio,
  transcribeVoiceNote,
} = require("./services/audio-processor");
const {
  generateImage,
  validatePrompt,
  generateStyledImage,
} = require("./services/image-generator");
const { createSticker } = require("./services/sticker-maker");
const {
  handleRealtimeRequest,
  getCurrentTimeNatural,
  getCryptoPrice,
} = require("./services/realtime-api");
const {
  processPDF,
  extractTextFromImage,
  analyzeImage,
  searchInPDF,
  performOCR,
} = require("./services/file-processor");
const {
  textToSpeech,
  getAvailableVoices,
} = require("./services/text-to-speech");
const { webSearch } = require("./services/search");
const {
  downloadAndConvertToMp3,
  removeFileSafe,
  isValidYouTubeUrl,
  DOWNLOAD_DIR,
} = require("./services/ytmp3");

// Memory Management
const {
  addToHistory,
  getContext,
  buildContextPrompt,
  clearHistory,
  getLastUserMessage,
} = require("./services/conversation-memory");

// Utilities
const { detectIntent } = require("./utils/intent-detector");

// Handlers
const { handleHelp } = require("./handlers/help");

// Global state
let sock = null;
let botActive = true;
let ownerJid = null;
let isConnected = false;

// User session management - stores user states and contexts
const userSessions = new Map();
const activatedUsers = new Set();

// Conversation contexts for continuous chat
const conversationContexts = new Map();

// ==================== VALIDATION ====================

const validateEnv = () => {
  const required = {
    GEMINI_API_KEY: { name: "Gemini API", critical: true },
  };

  const optional = {
    HF_TOKEN: { name: "Hugging Face", feature: "Image generation & voice" },
    GROQ_API_KEY: { name: "Groq", feature: "Alternative AI" },
    OPENAI_API_KEY: { name: "OpenAI", feature: "Alternative AI" },
    OPENROUTER_API_KEY: { name: "OpenRouter", feature: "Alternative AI" },
    COHERE_API_KEY: { name: "Cohere", feature: "Alternative AI" },
  };

  const missing = [];
  Object.entries(required).forEach(([key, info]) => {
    if (!process.env[key]) {
      missing.push(`${key} (${info.name})`);
    }
  });

  if (missing.length > 0) {
    logger.error(`❌ Missing required: ${missing.join(", ")}`);
    logger.error("Please create .env file with required API keys");
    process.exit(1);
  }

  logger.info("🔑 API Keys Status:");
  logger.info(`  ✅ ${required.GEMINI_API_KEY.name}: Configured`);

  Object.entries(optional).forEach(([key, info]) => {
    if (process.env[key]) {
      logger.info(`  ✅ ${info.name}: Configured`);
    } else {
      logger.warn(
        `  ⚠️  ${info.name}: Not configured (${info.feature} disabled)`,
      );
    }
  });
};

// ==================== SESSION MANAGEMENT ====================

class UserSession {
  constructor(userId) {
    this.userId = userId;
    this.conversationHistory = [];
    this.lastActivity = Date.now();
    this.context = {};
    this.preferences = {};
    this.activeFile = null;
    this.badWordCount = 0;
    this.lastWarningTime = 0;
    this.firstWarningTime = 0;
  }

  addMessage(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // Keep only last N messages
    if (this.conversationHistory.length > 10) {
      this.conversationHistory.shift();
    }

    this.lastActivity = Date.now();
  }

  getHistory() {
    // Filter out old messages
    const now = Date.now();
    const CONTEXT_EXPIRY_MS = 3600000; // 1 hour
    this.conversationHistory = this.conversationHistory.filter(
      (msg) => now - msg.timestamp < CONTEXT_EXPIRY_MS,
    );
    return this.conversationHistory;
  }

  setActiveFile(file) {
    this.activeFile = file;
  }

  getActiveFile() {
    return this.activeFile;
  }

  clearContext() {
    this.conversationHistory = [];
    this.context = {};
    this.activeFile = null;
  }
}

const getOrCreateSession = (userId) => {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, new UserSession(userId));
  }
  return userSessions.get(userId);
};

// ==================== UTILITY FUNCTIONS ====================

const hasPrefix = (text) => {
  return PREFIXES.some((prefix) => text.startsWith(prefix));
};

const removePrefix = (text) => {
  for (const prefix of PREFIXES) {
    if (text.startsWith(prefix)) {
      return text.substring(prefix.length).trim();
    }
  }
  return text;
};

const extractText = async (msg) => {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentMessage?.caption ||
    ""
  );
};

const downloadMedia = async (msg) => {
  try {
    const buffer = await downloadMediaMessage(msg, "buffer", {});
    return buffer;
  } catch (error) {
    logger.error("❌ Error downloading media:", error.message);
    return null;
  }
};

const getFileType = (msg) => {
  if (msg.message?.imageMessage) return "image";
  if (msg.message?.documentMessage) {
    const mimetype = msg.message.documentMessage.mimetype;
    if (mimetype?.includes("pdf")) return "pdf";
    return "document";
  }
  if (msg.message?.audioMessage) return "audio";
  if (msg.message?.videoMessage) return "video";
  return null;
};

const getReplyMessage = (msg) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted) {
    return (
      quoted.conversation ||
      quoted.extendedTextMessage?.text ||
      quoted.imageMessage?.caption ||
      quoted.videoMessage?.caption ||
      ""
    );
  }
  return null;
};

// ==================== MESSAGE HANDLERS ====================

const handleAdminCommands = async (sender, text) => {
  const cleanText = text.trim();

  if (cleanText === "/start" || cleanText === "/activate") {
    botActive = true;
    await sock.sendMessage(sender, {
      text: "✅ *MAXVY ACTIVATED*\n\nBot is now active and responding!\nReady to help! 🚀",
    });
    logger.info("✅ Bot activated by owner");
    return true;
  }

  if (cleanText === "/stop" || cleanText === "/deactivate") {
    botActive = false;
    await sock.sendMessage(sender, {
      text: "⏸️ *MAXVY DEACTIVATED*\n\nBot is now inactive.\nSend /start to reactivate.",
    });
    logger.info("⏸️ Bot deactivated by owner");
    return true;
  }

  if (cleanText === "/status") {
    const providers = await testAIProviders();
    const status = botActive ? "✅ ACTIVE" : "⏸️ INACTIVE";

    const statusText = `🤖 *MAXVY STATUS*

Status: ${status}
Version: 3.1.0
Sessions: ${userSessions.size} active
Memory: ${process.memoryUsage().heapUsed / 1024 / 1024}MB

🧠 AI Providers:
${providers.gemini || "❌ Gemini not configured"}
${providers.groq || "❌ Groq not configured"}
${providers.openrouter || "❌ OpenRouter not configured"}

Ready to help! 🚀`;

    await sock.sendMessage(sender, { text: statusText });
    return true;
  }

  if (cleanText === "/clearmemory") {
    userSessions.clear();
    await sock.sendMessage(sender, {
      text: "🧹 All conversation memory cleared!",
    });
    return true;
  }

  return false;
};

const handlePrivateActivation = async (sender, text, isGroup) => {
  if (isGroup) {
    return false; // Groups are auto-activated
  }

  const cleanText = text.trim();

  if (cleanText === `/${ACTIVATION_CMD}`) {
    activatedUsers.add(sender);
    await sock.sendMessage(sender, {
      text: "✅ *Bot Activated!*\n\nYou can now use all MAXVY commands.\n\nTry: .help or just chat directly!\n\nReady to help!",
    });
    logger.info(`✅ User activated: ${sender}`);
    return true;
  }

  if (cleanText === `/${DEACTIVATION_CMD}`) {
    activatedUsers.delete(sender);
    await sock.sendMessage(sender, {
      text: `⏸️ Bot deactivated.\nSend /${ACTIVATION_CMD} to use again.`,
    });
    logger.info(`⏸️ User deactivated: ${sender}`);
    return true;
  }

  return false;
};

// ==================== INTENT PROCESSORS ====================

const processIntent = async (intent, msg, sender, fileBuffer, fileType) => {
  const session = getOrCreateSession(sender);

  try {
    switch (intent.type) {
      case "reminder":
        return await handleReminderIntent(intent, sender);

      case "list_reminders":
        return await handleListRemindersIntent(sender);

      case "generate_image":
        return await handleImageGenerationIntent(intent, sender);

      case "sticker":
        return await handleStickerIntent(intent, fileBuffer, msg);

      case "transcribe_audio":
        return await handleTranscribeIntent(fileBuffer);

      case "ocr":
        return await handleOCRIntent(fileBuffer);

      case "describe_image":
        return await handleDescribeImageIntent(fileBuffer);

      case "process_pdf":
        return await handlePDFIntent(intent, fileBuffer, session);

      case "tts":
        return await handleTTSIntent(intent.params?.text || intent.query);

      case "realtime_data":
        return await handleRealtimeRequest(intent.params);

      case "crypto":
        return await handleCryptoIntent(intent.params?.symbol || "BTC");

      case "web_search":
        return await handleWebSearchIntent(intent, sender);

      case "ytmp3":
        return await handleYtMp3Intent(intent, sender, msg);

      case "help":
        return "📖 *HELP MENU*\n\nCommands:\n• .help - Show this menu\n• .image [prompt] - Generate image\n• .sticker - Create sticker\n• .ocr - Extract text from image\n• .pdf - Process PDF\n• .ingetin - Set reminder\n\nJust chat normally for AI responses!";

      default:
        // Process with AI including conversation context
        return await handleAIChat(intent.query, session, fileBuffer, fileType);
    }
  } catch (error) {
    logger.error(`❌ Intent processing error: ${error.message}`);
    session.addMessage("system", `Error: ${error.message}`);
    return `❌ Error: ${error.message}\n\nPlease try again or use .help`;
  }
};

// ==================== INTENT HANDLERS ====================

const handleAIChat = async (
  query,
  session,
  fileBuffer = null,
  fileType = null,
) => {
  try {
    console.log("🔍 handleAIChat called with query:", query);
    
    // Build context from session history
    const history = session.getHistory();
    let contextPrompt = "";

    // Add conversation history to context
    if (history.length > 0) {
      contextPrompt = "[Previous conversation]\n";
      history.forEach((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        contextPrompt += `${role}: ${msg.content}\n`;
      });
      contextPrompt += "\n[Current message]\n";
    }

    contextPrompt += `User: ${query}`;

    // Add file context if exists
    if (session.getActiveFile()) {
      contextPrompt += `\n\n[Context: User has uploaded a ${session.getActiveFile().type} file with content related to: ${session.getActiveFile().summary || "various topics"}]`;
    }

    // Add current file if provided
    if (fileBuffer && fileType === "pdf") {
      const pdfData = await processPDF(fileBuffer);
      session.setActiveFile({
        type: "PDF",
        pages: pdfData.pages,
        summary: pdfData.text.substring(0, 200),
      });
      contextPrompt += `\n\n[PDF Content (${pdfData.pages} pages)]:\n${pdfData.text.substring(0, 2000)}...`;
    }

    // Handle image analysis
    if (fileBuffer && fileType === "image") {
      console.log("🖼️ Image detected, analyzing...");
      try {
        const imageAnalysis = await analyzeImage(fileBuffer);
        contextPrompt += `\n\n[Image Analysis]:\n${imageAnalysis}`;
        console.log("✅ Image analyzed successfully");
      } catch (error) {
        logger.error(`❌ Image analysis error: ${error.message}`);
        contextPrompt += `\n\n[Image uploaded but analysis failed. Please describe what you see or ask about the image.]`;
      }
    }

    // Detect if this is a search request
    const isSearchRequest = /\b(cari|carikan|search|find|info|informasi|jadwal|schedule|berita|news)\b/i.test(query);
    
    // Auto search if needed
    if (isSearchRequest && !fileBuffer) {
      console.log("🔍 Search request detected, performing web search...");
      try {
        // Extract search query
        let searchQuery = query
          .replace(/^(cari|carikan|search|find|info|informasi)\s+(tentang|about|untuk|for)?\s*/i, "")
          .trim();
        
        if (searchQuery.length > 3) {
          const searchResults = await webSearch(searchQuery, { limit: 3 });
          
          if (searchResults && searchResults.length > 0) {
            contextPrompt += `\n\n[Web Search Results for "${searchQuery}"]:\n`;
            searchResults.forEach((result, index) => {
              contextPrompt += `${index + 1}. ${result.title}\n`;
              if (result.snippet) contextPrompt += `   ${result.snippet}\n`;
              if (result.url) contextPrompt += `   URL: ${result.url}\n`;
            });
            console.log(`✅ Found ${searchResults.length} search results`);
          }
        }
      } catch (error) {
        console.log("⚠️ Web search failed:", error.message);
      }
    }
    
    console.log("🤖 Calling generateAI...");
    
    // Detect if this is a coding request
    const isCodingRequest = /\b(buat|buatin|bikin|generate|create|code|coding|program|script|function|class)\b.*\b(code|python|javascript|java|html|css|php|ruby|go|rust|c\+\+|c#)\b/i.test(query);
    
    // Generate AI response with context
    const response = await generateAI(contextPrompt, {
      useMaxvyPersona: true,
      temperature: isCodingRequest ? 0.3 : 0.8, // Lower temp for code = more precise
    });

    console.log("✅ AI response received:", response?.substring(0, 100));

    // Save to session history
    session.addMessage("user", query);
    session.addMessage("assistant", response);

    return response;
  } catch (error) {
    logger.error(`❌ AI chat error: ${error.message}`);
    console.error("AI chat error stack:", error.stack);
    throw error;
  }
};

const handleReminderIntent = async (intent, sender) => {
  try {
    const params = intent.params || {};

    const remindersToCreate = Array.isArray(params.multi)
      ? params.multi
      : [params];

    const createdReminders = [];

    for (const item of remindersToCreate) {
      const { time, message, recurring, intervalMs } = item || {};

      const parsedTime = parseNaturalTime(time, intervalMs);

      if (!parsedTime?.nextTrigger) {
        continue;
      }

      const reminder = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: sender,
        time: parsedTime.nextTrigger.toISOString(),
        message: message || "Reminder",
        recurring: parsedTime.isRecurring,
        intervalMs: parsedTime.intervalMs || null,
        created: new Date().toISOString(),
        active: true,
        originalInput: item.original || time,
      };

      if (!reminders[sender]) {
        reminders[sender] = [];
      }

      reminders[sender].push(reminder);
      createdReminders.push({ reminder, parsedTime });
    }

    if (createdReminders.length === 0) {
      return (
        "❌ Format waktu tidak dikenali. Coba gunakan format seperti:\n" +
        "• 15:30 rapat\n" +
        "• 1 jam lagi rapat\n" +
        "• setiap 5 menit peregangan"
      );
    }

    await saveData();

    if (createdReminders.length === 1) {
      const { reminder, parsedTime } = createdReminders[0];
      const scheduleInfo = reminder.recurring
        ? parsedTime.intervalLabel || "Recurring"
        : moment(reminder.time).calendar();

      return (
        "✅ *Reminder Created!*" +
        `\n\n⏰ Jadwal: ${scheduleInfo}` +
        `\n📝 Catatan: ${reminder.message}` +
        (reminder.recurring
          ? "\n🔁 Aku bakal kirim pengingat sesuai interval yang kamu minta!"
          : "\n🔔 Siap! Nanti aku ingetin kamu pas waktunya ya! 😊")
      );
    }

    let response = "✅ *Beberapa reminder berhasil dibuat!*\n";
    createdReminders.forEach(({ reminder, parsedTime }, index) => {
      const scheduleInfo = reminder.recurring
        ? parsedTime.intervalLabel || "Recurring"
        : moment(reminder.time).calendar();

      response += `\n${index + 1}. ⏰ ${scheduleInfo}\n   📝 ${reminder.message}`;
    });

    response +=
      "\n\n🔔 Aku bakal ingetin kamu sesuai jadwal masing-masing, tenang aja!";

    return response;
  } catch (error) {
    logger.error(`❌ Reminder error: ${error.message}`);
    return "❌ Failed to create reminder. Please try again.";
  }
};

const handleListRemindersIntent = async (sender) => {
  const userReminders = reminders[sender] || [];

  if (userReminders.length === 0) {
    return "📭 You have no active reminders.\n\nCreate one: .ingetin [time] [message]";
  }

  let text = "📋 *Your Active Reminders:*\n\n";

  userReminders
    .filter((r) => r.active)
    .forEach((r, index) => {
      const time = moment(r.time).format("DD MMM YYYY - HH:mm");
      text += `${index + 1}. ⏰ ${time}\n   📝 ${r.message}\n   🆔 ID: ${r.id}\n\n`;
    });

  text += "\n_To delete: .hapusreminder [id]_";

  return text;
};

const handleImageGenerationIntent = async (intent, sender) => {
  try {
    const prompt = intent.params?.prompt || intent.query;

    if (!prompt || prompt.length < 3) {
      return "❌ Please provide a description.\nExample: .image a beautiful sunset over mountains";
    }

    // Check if HF token exists
    if (!process.env.HF_TOKEN) {
      return "❌ Image generation not configured.\nAdmin needs to add HF_TOKEN to .env";
    }

    await sock.sendMessage(sender, {
      text: "🎨 Generating image... Please wait (10-30 seconds)...",
    });

    const imageBuffer = await generateImage(prompt, {
      style: intent.params?.style || "realistic",
      width: 512,
      height: 512,
    });

    await sock.sendMessage(sender, {
      image: imageBuffer,
      caption: `🎨 *Generated Image*\n\nPrompt: ${prompt}\n\nCreated with AI by maxvy.ai 🚀`,
    });

    return null; // Image already sent
  } catch (error) {
    logger.error(`❌ Image generation error: ${error.message}`);
    return `❌ Image generation failed: ${error.message}`;
  }
};

const handleStickerIntent = async (intent, fileBuffer, msg) => {
  try {
    const params = intent.params || {};
    
    // Check if it's a text sticker
    if (!fileBuffer && params.text) {
      console.log(`📝 Creating text sticker: "${params.text}"`);
      
      const stickerBuffer = await createSticker({
        type: "text",
        data: params.text,
        options: {
          bgColor: params.bgColor || "#FF6B35",
          textColor: params.textColor || "#FFFFFF",
          style: params.style || "default",
          metadata: {
            packname: "MAXVY Stickers",
            author: "maxvy.ai",
          },
        },
      });

      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBuffer,
      });

      return null; // Sticker already sent
    }
    
    // Image sticker
    if (!fileBuffer) {
      return "❌ Kirim gambar dengan caption .sticker atau buat text sticker dengan .sticker \"text kamu\"";
    }

    const stickerBuffer = await createSticker({
      type: "image",
      data: fileBuffer,
      options: {
        metadata: {
          packname: "MAXVY Stickers",
          author: "maxvy.ai",
        },
      },
    });

    await sock.sendMessage(msg.key.remoteJid, {
      sticker: stickerBuffer,
    });

    return null; // Sticker already sent
  } catch (error) {
    logger.error(`❌ Sticker error: ${error.message}`);
    return "❌ Gagal membuat sticker. Coba lagi atau gunakan gambar/text lain.";
  }
};

const handleTranscribeIntent = async (fileBuffer) => {
  try {
    if (!fileBuffer) {
      return "❌ Please send an audio file to transcribe";
    }

    const transcription = await transcribeAudio(fileBuffer);

    return `🎤 *Audio Transcription:*\n\n${transcription.text}\n\n_Confidence: ${transcription.confidence || "N/A"}_`;
  } catch (error) {
    logger.error(`❌ Transcribe error: ${error.message}`);
    return "❌ Failed to transcribe audio. Please try again.";
  }
};

const handleOCRIntent = async (fileBuffer) => {
  try {
    if (!fileBuffer) {
      return "❌ Please send an image for OCR";
    }

    const result = await performOCR(fileBuffer);

    return `🔍 *Text Extracted:*\n\n${result.text}\n\n_Confidence: ${result.confidence?.toFixed(1)}%_`;
  } catch (error) {
    logger.error(`❌ OCR error: ${error.message}`);
    return "❌ Failed to extract text. Try a clearer image.";
  }
};

const handleDescribeImageIntent = async (fileBuffer) => {
  try {
    if (!fileBuffer) {
      return "❌ Please send an image to describe";
    }

    const description = await analyzeImage(fileBuffer);

    return `👁️ *Image Analysis:*\n\n${description}`;
  } catch (error) {
    logger.error(`❌ Image analysis error: ${error.message}`);
    return "❌ Failed to analyze image. Please try again.";
  }
};

const handlePDFIntent = async (intent, fileBuffer, session) => {
  try {
    if (!fileBuffer) {
      return "❌ Please send a PDF file to process";
    }

    const pdfData = await processPDF(fileBuffer);

    // Store PDF in session for future queries
    session.setActiveFile({
      type: "PDF",
      pages: pdfData.pages,
      text: pdfData.text,
      summary: pdfData.text.substring(0, 500),
    });

    const summary = pdfData.text.substring(0, 1000);

    return `📄 *PDF Processed Successfully!*\n\n📊 Pages: ${pdfData.pages}\n📝 Characters: ${pdfData.text.length}\n\n*Preview:*\n${summary}...\n\n_You can now ask questions about this PDF!_`;
  } catch (error) {
    logger.error(`❌ PDF error: ${error.message}`);
    return "❌ Failed to process PDF. File might be corrupted.";
  }
};

const handleTTSIntent = async (text) => {
  try {
    if (!text || text.length < 2) {
      return "❌ Please provide text to convert.\nExample: .tts Hello world";
    }

    if (!process.env.HF_TOKEN) {
      return "❌ TTS not configured. Admin needs to add HF_TOKEN.";
    }

    const audioBuffer = await textToSpeech(text, {
      language: "en",
      voice: "default",
    });

    await sock.sendMessage(sender, {
      audio: audioBuffer,
      mimetype: "audio/mpeg",
      ptt: true,
    });

    return null; // Audio already sent
  } catch (error) {
    logger.error(`❌ TTS error: ${error.message}`);
    return "❌ Failed to generate speech. Please try again.";
  }
};

const handleCryptoIntent = async (symbol = "BTC") => {
  try {
    const price = await getCryptoPrice(symbol);
    return price;
  } catch (error) {
    logger.error(`❌ Crypto error: ${error.message}`);
    return `❌ Failed to get crypto price for ${symbol}`;
  }
};

const handleWebSearchIntent = async (intent, sender) => {
  const query = intent.params?.query || intent.query;

  if (!query || query.length < 2) {
    return "❌ Tolong tulis kata kunci setelah kata 'cari'. Contoh: cari berita AI terbaru";
  }

  try {
    const results = await webSearch(query, { limit: 3 });

    if (!results.length) {
      return "🙈 Maaf, aku nggak menemukan hasil yang cocok. Coba pakai kata kunci lain ya!";
    }

    let response = `🔍 *Hasil pencarian untuk:* ${query}\n\n`;

    results.forEach((item, index) => {
      response += `*${index + 1}. ${item.title || "(Tanpa judul)"}*\n`;
      if (item.snippet) {
        response += `${item.snippet}\n`;
      }
      if (item.url) {
        response += `🔗 ${item.url}\n`;
      }
      response += "\n";
    });

    response += "✨ Gunakan kata kunci lain kalau butuh info tambahan!";

    return response.trim();
  } catch (error) {
    logger.error(`❌ Web search error: ${error.message}`);
    return "❌ Maaf, pencarian sedang bermasalah. Coba lagi sebentar ya.";
  }
};

// ==================== MESSAGE PROCESSOR ====================

// Bot trigger keywords for all chats
const BOT_TRIGGERS = ['max', 'bot', 'ai', '@max', 'hey max', 'hai max', 'halo max'];

// Check if bot is mentioned/triggered
function isBotMentioned(text, isGroup) {
  // Check for command prefix first (always respond to commands)
  if (text.startsWith('.') || text.startsWith('!') || text.startsWith('/')) {
    return true;
  }
  
  const lowerText = text.toLowerCase().trim();
  
  // Check if any trigger keyword is present
  return BOT_TRIGGERS.some(trigger => 
    lowerText.startsWith(trigger) || 
    lowerText.includes(`@${trigger}`) ||
    lowerText.includes(`hey ${trigger}`) ||
    lowerText.includes(`hai ${trigger}`) ||
    lowerText.includes(`halo ${trigger}`)
  );
}

// Remove trigger keywords from text
function removeTriggerKeywords(text) {
  let cleanText = text;
  BOT_TRIGGERS.forEach(trigger => {
    const regex = new RegExp(`^${trigger}\\s*[,:]?\\s*|@${trigger}\\s*|hey\\s+${trigger}\\s*|hai\\s+${trigger}\\s*|halo\\s+${trigger}\\s*`, 'gi');
    cleanText = cleanText.replace(regex, '').trim();
  });
  return cleanText;
}

const processMessage = async (msg) => {
  try {
    const sender = msg.key.remoteJid;
    const isGroup = sender.endsWith("@g.us");
    const text = await extractText(msg);
    const messageType = msg.message ? Object.keys(msg.message)[0] : null;

    // Skip if bot is inactive (except for owner)
    if (!botActive && sender !== ownerJid) {
      return;
    }
    
    // Only respond if bot is mentioned/triggered (both private and group)
    // This prevents bot from responding to every message
    if (!isBotMentioned(text, isGroup) && !hasPrefix(text)) {
      return; // Ignore messages that don't mention bot
    }

    // Check for bad words and handle abuse (track only, don't respond)
    if (containsBadWords(text)) {
      const session = getOrCreateSession(sender);
      session.badWordCount = (session.badWordCount || 0) + 1;
      session.lastWarningTime = Date.now();

      // Only deactivate if extremely abusive (5+ bad words in short time)
      const recentBadWords = session.badWordCount;
      const timeSinceFirstWarning = Date.now() - (session.firstWarningTime || Date.now());

      if (recentBadWords >= 5 && timeSinceFirstWarning < 300000) { // 5 min
        // Deactivate user for extreme abuse
        activatedUsers.delete(sender);
        await sock.sendMessage(sender, {
          text: "⛔ Anda telah dinonaktifkan karena melanggar aturan. Silakan hubungi admin untuk aktivasi ulang."
        });
        logger.warn(`⛔ User deactivated for extreme abuse: ${sender}`);
        return;
      }

      // Track first warning time
      if (!session.firstWarningTime) {
        session.firstWarningTime = Date.now();
      }

      // Continue processing normally without warning response
    }

    // Check activation status for private chats
    if (!isGroup) {
      if (!activatedUsers.has(sender)) {
        const handled = await handlePrivateActivation(sender, text, isGroup);
        if (!handled && text.trim().length > 0) {
          await sock.sendMessage(sender, {
            text: `👋 Hi! I'm Max from maxvy.ai\n\nTo start using me, send: /${ACTIVATION_CMD}`,
          });
        }
        return;
      }
    }

    // Handle admin commands
    if (sender === ownerJid) {
      const handled = await handleAdminCommands(sender, text);
      if (handled) return;
    }

    // Get or create user session
    const session = getOrCreateSession(sender);

    // Get reply context
    const replyMessage = getReplyMessage(msg);
    if (replyMessage) {
      session.addMessage("context", `Replying to: "${replyMessage}"`);
    }

    // Handle file uploads
    let fileBuffer = null;
    let fileType = getFileType(msg);

    if (fileType) {
      fileBuffer = await downloadMedia(msg);
      if (!fileBuffer) {
        await sock.sendMessage(sender, {
          text: "❌ Failed to download file. Please try again.",
        });
        return;
      }
    }

    // Process commands or natural chat
    let response = null;
    let cleanText = removePrefix(text);
    
    // Remove trigger keywords from text (both private and group)
    cleanText = removeTriggerKeywords(cleanText);

    // Check if it's a command
    if (hasPrefix(text)) {
      const intent = await detectIntent(cleanText);
      response = await processIntent(intent, msg, sender, fileBuffer, fileType);
    } else if ((cleanText && cleanText.trim().length > 2) || fileBuffer) {
      // Natural conversation - always process with AI
      response = await handleAIChat(cleanText, session, fileBuffer, fileType);
    }

    // Send response if generated
    if (response) {
      await sock.sendMessage(sender, { text: response });
    }
  } catch (error) {
    logger.error("❌ Message processing error:", error.message);
    logger.error("Stack trace:", error.stack);
    console.error("Full error:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ An error occurred. Please try again.",
    });
  }
};

// ==================== REMINDER CHECKER ====================

const checkReminders = async () => {
  if (!sock) return;

  const now = moment();

  for (const [userId, userReminders] of Object.entries(reminders)) {
    for (const reminder of userReminders) {
      if (!reminder.active) continue;

      const reminderTime = moment(reminder.time);

      if (reminderTime.isSameOrBefore(now)) {
        try {
          await sock.sendMessage(userId, {
            text: `⏰ *REMINDER!*\n\n${reminder.message}\n\n📅 ${reminderTime.calendar()}`,
          });

          if (reminder.recurring && reminder.intervalMs) {
            const nextTrigger = reminderTime.add(
              reminder.intervalMs,
              "milliseconds",
            );
            reminder.time = nextTrigger.toISOString();
          } else if (reminder.recurring) {
            reminder.time = reminderTime.add(1, "day").toISOString();
          } else {
            reminder.active = false;
          }

          await saveData();
          logger.info(`✅ Reminder sent to ${userId}: ${reminder.message}`);
        } catch (error) {
          logger.error(`❌ Failed to send reminder: ${error.message}`);
        }
      }
    }
  }
};

// ==================== CONNECTION HANDLER ====================

const connectToWhatsApp = async () => {
  try {
    // Initialize storage
    await initStorage();

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(
      "./auth_info_baileys",
    );

    // Create socket connection
    sock = makeWASocket({
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
    });

    // Connection update handler
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.clear();
        console.log("\n════════════════════════════════════════");
        console.log("    MAXVY v3.1 - WhatsApp AI Bot");
        console.log("    Created by maxvy.ai");
        console.log("════════════════════════════════════════\n");
        console.log("📱 Scan QR Code with WhatsApp:\n");
        qrcode.generate(qr, { small: true });
        console.log("\n🔗 Or use this link:");
        console.log(`https://wa.me/qr/${qr}\n`);
        
        // Save QR code for web access
        setQRCode(qr);
        console.log(`\n🌐 Or open in browser: https://your-bot-url.railway.app/qr\n`);
      }

      if (connection === "close") {
        isConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.message || "Unknown";
        logger.warn(
          `⚠️ Connection closed (status: ${statusCode || "n/a"}) - ${reason}`,
        );

        const shouldReconnect = statusCode !== 401;

        if (shouldReconnect) {
          logger.info("🔄 Reconnecting...");
          setTimeout(() => connectToWhatsApp(), 5000);
        } else {
          logger.info("🔒 Logged out from WhatsApp (session invalid)");
          logger.info(
            "ℹ️ Delete ./auth_info_baileys and scan QR again to create a new session.",
          );
        }
      } else if (connection === "open" && !isConnected) {
        isConnected = true;
        console.clear();
        logger.info("════════════════════════════════════════");
        logger.info("    ✅ MAXVY Bot Connected!");
        logger.info("    Version: 3.1.0");
        logger.info("    Ready to assist!");
        logger.info("════════════════════════════════════════\n");

        // Get owner JID
        const user = sock.user;
        ownerJid = user?.id;

        if (ownerJid) {
          logger.info(`👤 Owner: ${ownerJid}`);

          // Send startup message
          await sock.sendMessage(ownerJid, {
            text: `🚀 *MAXVY Bot Started!*\n\nVersion: ${CONFIG.BOT_INFO.VERSION}\nStatus: Active\n\nAll systems operational! Ready to help. 💪\n\nType .help for commands`,
          });
        }

        // Test AI providers
        const providers = await testAIProviders();
        logger.info("🧠 AI Providers:", providers);
      }
    });

    // Credentials update handler
    sock.ev.on("creds.update", saveCreds);

    // Message handler
    sock.ev.on("messages.upsert", async ({ messages }) => {
      for (const msg of messages) {
        // Skip if from self or status broadcast
        if (
          msg.key.fromMe ||
          msg.key.remoteJid === "status@broadcast"
        ) {
          continue;
        }

        // Process message
        await processMessage(msg);
      }
    });
  } catch (error) {
    logger.error("❌ Connection error:", error.message || error);
    console.error("Full error details:", error);
    setTimeout(() => connectToWhatsApp(), 5000);
  }
};

// ==================== CLEANUP ====================

const cleanup = async () => {
  logger.info("🧹 Cleaning up...");

  // Clear old sessions
  const now = Date.now();
  for (const [userId, session] of userSessions.entries()) {
    if (now - session.lastActivity > CONFIG.MEMORY.CONTEXT_EXPIRY_MS) {
      userSessions.delete(userId);
    }
  }

  logger.info(`✅ Cleaned ${userSessions.size} sessions`);
};

// ==================== SHUTDOWN HANDLER ====================

process.on("SIGINT", async () => {
  logger.info("\n🛑 Shutting down gracefully...");

  try {
    // Save data
    await saveData();

    logger.info("✅ Shutdown complete (connection preserved)");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Shutdown error:", error);
    process.exit(1);
  }
});

process.on("uncaughtException", (error) => {
  logger.error("❌ Uncaught exception:", error);
  // Don't exit, try to recover
});

process.on("unhandledRejection", (error) => {
  logger.error("❌ Unhandled rejection:", error);
  // Don't exit, try to recover
});

// ==================== MAIN ====================

const main = async () => {
  console.clear();
  console.log("════════════════════════════════════════════════");
  console.log("");
  console.log("    🤖 MAXVY v3.1 - Advanced AI Assistant");
  console.log("    💻 Created by maxvy.ai");
  console.log("    🚀 WhatsApp Bot with Memory & Intelligence");
  console.log("");
  console.log("════════════════════════════════════════════════\n");

  // Validate environment
  validateEnv();

  // Initialize storage
  await initStorage();

  // Test AI providers
  logger.info("🧠 Testing AI providers...");
  const providers = await testAIProviders();

  // Start reminder checker
  cron.schedule("* * * * *", checkReminders);
  logger.info("⏰ Reminder scheduler started");

  // Start cleanup scheduler
  cron.schedule("*/30 * * * *", cleanup);
  logger.info("🧹 Cleanup scheduler started");

  // Connect to WhatsApp
  logger.info("📱 Connecting to WhatsApp...");
  await connectToWhatsApp();
};

// Start the bot
main().catch((error) => {
  logger.error("❌ Fatal error:", error);
  process.exit(1);
});
