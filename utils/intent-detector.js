// === ADVANCED INTENT DETECTOR ===
// Smart natural language understanding for free-form commands

const chrono = require("chrono-node");

/**
 * Detect user intent from natural language
 * @param {string} text - User message
 * @param {Object} context - Message context (file type, previous messages, etc)
 * @returns {Object} Detected intent and parameters
 */
function detectIntent(text, context = {}) {
  const lowerText = text.toLowerCase().trim();
  const { hasFile, fileType, fileCount, previousIntent } = context;

  // Remove prefix if exists
  const cleanText = lowerText.replace(/^[.!\/]\s*/, "");

  // Detect intent based on keywords and context
  const intent = {
    type: null,
    confidence: 0,
    params: {},
    rawText: cleanText,
    query: cleanText, // Add query property for AI processing
  };

  // ==================== REMINDER MANAGEMENT INTENTS (Check First!) ====================
  if (detectListReminders(cleanText)) {
    intent.type = "list_reminders";
    intent.confidence = 0.95;
    intent.params = {};
    return intent;
  }

  if (detectDeleteReminder(cleanText)) {
    intent.type = "delete_reminder";
    intent.confidence = 0.95;
    intent.params = parseDeleteReminderParams(cleanText);
    return intent;
  }

  if (detectEditReminder(cleanText)) {
    intent.type = "edit_reminder";
    intent.confidence = 0.9;
    intent.params = parseEditReminderParams(cleanText);
    return intent;
  }

  // ==================== REMINDER INTENTS ====================
  if (detectReminder(cleanText)) {
    intent.type = "reminder";
    intent.confidence = 0.9;
    intent.params = parseReminderParams(cleanText);
    return intent;
  }

  if (detectYtMp3(cleanText)) {
    intent.type = "ytmp3";
    intent.confidence = 0.95;
    intent.params = parseYtMp3Params(cleanText);
    return intent;
  }

  // ==================== TRANSLATION INTENTS ====================
  if (detectTranslation(cleanText)) {
    intent.type = "translate";
    intent.confidence = 0.9;
    intent.params = parseTranslationParams(cleanText);
    return intent;
  }

  // ==================== SUMMARIZATION INTENTS ====================
  if (detectSummarization(cleanText, hasFile, fileType)) {
    intent.type = "summarize";
    intent.confidence = 0.85;
    intent.params = { fileType, fileCount };
    return intent;
  }

  // ==================== STICKER CREATION INTENTS ====================
  if (detectStickerCreation(cleanText, hasFile)) {
    intent.type = "sticker";
    intent.confidence = 0.9;
    intent.params = parseStickerParams(cleanText, hasFile, fileType);
    return intent;
  }

  // ==================== IMAGE GENERATION INTENTS ====================
  if (detectImageGeneration(cleanText)) {
    intent.type = "generate_image";
    intent.confidence = 0.95;
    intent.params = parseImageGenerationParams(cleanText);
    return intent;
  }

  // ==================== OCR / TEXT EXTRACTION INTENTS ====================
  if (detectOCR(cleanText, hasFile, fileType)) {
    intent.type = "ocr";
    intent.confidence = 0.85;
    intent.params = { fileType };
    return intent;
  }

  // ==================== IMAGE DESCRIPTION INTENTS ====================
  if (detectImageDescription(cleanText, hasFile, fileType)) {
    intent.type = "describe_image";
    intent.confidence = 0.9;
    intent.params = { fileType, fileCount };
    return intent;
  }

  // ==================== AUDIO TRANSCRIPTION INTENTS ====================
  if (detectAudioTranscription(cleanText, hasFile, fileType)) {
    intent.type = "transcribe_audio";
    intent.confidence = 0.95;
    intent.params = { fileType, fileCount };
    return intent;
  }

  // ==================== PDF PROCESSING INTENTS ====================
  if (detectPDFProcessing(cleanText, hasFile, fileType)) {
    intent.type = "process_pdf";
    intent.confidence = 0.9;
    intent.params = parsePDFParams(cleanText);
    return intent;
  }

  // ==================== SEARCH INTENTS ====================
  if (detectSearch(cleanText, hasFile)) {
    intent.type = "search";
    intent.confidence = 0.8;
    intent.params = parseSearchParams(cleanText);
    return intent;
  }

  // ==================== COMPARISON INTENTS ====================
  if (detectComparison(cleanText, fileCount)) {
    intent.type = "compare";
    intent.confidence = 0.85;
    intent.params = { fileCount, fileType };
    return intent;
  }

  // ==================== URL PROCESSING INTENTS ====================
  if (detectURLProcessing(cleanText)) {
    intent.type = "process_url";
    intent.confidence = 0.9;
    intent.params = parseURLParams(cleanText);
    return intent;
  }

  // ==================== CODE GENERATION INTENTS ====================
  if (detectCodeGeneration(cleanText)) {
    intent.type = "generate_code";
    intent.confidence = 0.85;
    intent.params = { task: cleanText };
    return intent;
  }

  // ==================== WEB SEARCH / BROWSER INTENTS ====================
  if (detectWebSearch(cleanText)) {
    intent.type = "web_search";
    intent.confidence = 0.9;
    intent.params = parseWebSearchParams(cleanText);
    return intent;
  }

  // ==================== REAL-TIME DATA INTENTS ====================
  if (detectRealtimeData(cleanText)) {
    intent.type = "realtime_data";
    intent.confidence = 0.9;
    intent.params = parseRealtimeParams(cleanText);
    return intent;
  }

  // ==================== GENERIC FILE PROCESSING ====================
  if (hasFile && detectGenericFileIntent(cleanText)) {
    intent.type = "process_file";
    intent.confidence = 0.7;
    intent.params = { fileType, action: cleanText };
    return intent;
  }

  // ==================== QUESTION / AI CHAT (DEFAULT) ====================
  if (detectQuestion(cleanText) || cleanText.length > 10) {
    intent.type = "ai_chat";
    intent.confidence = 0.6;
    intent.params = { question: cleanText };
    return intent;
  }

  // Unknown intent
  intent.type = "unknown";
  intent.confidence = 0.3;
  return intent;
}

// ==================== DETECTION FUNCTIONS ====================

function detectReminder(text) {
  // Exclude questions about time (not reminders)
  const timeQuestions = [
    "jam berapa",
    "what time",
    "pukul berapa",
    "waktu berapa",
    "sekarang jam",
    "current time",
    "what's the time",
  ];

  if (timeQuestions.some((q) => text.includes(q))) {
    return false;
  }

  // Weather/general questions that should NOT be reminders
  const weatherQuestions = [
    "besok hujan",
    "besok cerah",
    "besok panas",
    "besok dingin",
    "cuaca besok",
    "weather tomorrow",
    "hujan ga",
    "ujan ga",
  ];

  // Check if it's a weather question first
  if (weatherQuestions.some((q) => text.includes(q))) {
    return false;
  }

  const reminderKeywords = [
    "ingetin",
    "ingat",
    "reminder",
    "remind",
    "alarm",
    "setiap",
    "every",
    "ingatkan",
    "atur alarm",
    "set alarm",
    "set reminder",
  ];

  // Check for time patterns with task context (not just time alone)
  // Must have format: jam HH.MM/HH:MM followed by a task
  const hasTimeWithTask = /(?:jam|pukul|at)\s+\d{1,2}[.:]\d{2}\s+\w+/i.test(
    text,
  );

  // Check for recurring patterns
  const hasRecurringPattern =
    /setiap \d+ (menit|jam|hari)|every \d+ (minute|hour|day)|setiap hari|every day/i.test(
      text,
    );

  // Must have either:
  // 1. Explicit reminder keyword
  // 2. Time with task (jam 14.00 meeting)
  // 3. Recurring pattern
  const hasKeyword = reminderKeywords.some((keyword) => text.includes(keyword));

  return hasKeyword || hasTimeWithTask || hasRecurringPattern;
}

function detectListReminders(text) {
  const listKeywords = [
    "listreminder",
    "list reminder",
    "lihat reminder",
    "tampilkan reminder",
    "daftar reminder",
    "show reminder",
    "my reminder",
    "reminder saya",
    "reminder aku",
  ];
  return listKeywords.some((keyword) => text.includes(keyword));
}

function detectDeleteReminder(text) {
  const deleteKeywords = [
    "delreminder",
    "deletereminder",
    "del reminder",
    "delete reminder",
    "hapus reminder",
    "remove reminder",
    "cancel reminder",
    "batalkan reminder",
  ];
  return deleteKeywords.some((keyword) => text.includes(keyword));
}

function detectEditReminder(text) {
  const editKeywords = [
    "editreminder",
    "edit reminder",
    "ubah reminder",
    "update reminder",
    "ganti reminder",
    "change reminder",
  ];
  return editKeywords.some((keyword) => text.includes(keyword));
}

function detectTranslation(text) {
  const translationKeywords = [
    "translate",
    "terjemahkan",
    "bahasa",
    "language",
    "ke english",
    "ke indonesia",
    "ke japanese",
    "ke spanish",
    "to english",
    "to indonesian",
    "in english",
  ];
  return translationKeywords.some((keyword) => text.includes(keyword));
}

function detectSummarization(text, hasFile, fileType) {
  const summaryKeywords = [
    "rangkum",
    "ringkas",
    "summarize",
    "summary",
    "simpulkan",
    "kesimpulan",
    "conclusion",
    "tldr",
    "intisari",
  ];

  // Higher confidence if file is present
  if (hasFile && (fileType === "pdf" || fileType === "document")) {
    return (
      summaryKeywords.some((keyword) => text.includes(keyword)) ||
      text.includes("isi") ||
      text.includes("tentang apa")
    );
  }

  return summaryKeywords.some((keyword) => text.includes(keyword));
}

function detectStickerCreation(text, hasFile) {
  const stickerKeywords = [
    "stiker",
    "sticker",
    "buatin stiker",
    "bikin stiker",
    "jadiin stiker",
    "convert to sticker",
    "make sticker",
  ];

  // Check for text sticker
  if (
    !hasFile &&
    (text.includes("buatin stiker") || text.includes("stiker text"))
  ) {
    return true;
  }

  // Check for image to sticker
  if (hasFile && (text.includes("jadiin stiker") || text.includes("stiker"))) {
    return true;
  }

  return stickerKeywords.some((keyword) => text.includes(keyword));
}

function detectOCR(text, hasFile, fileType) {
  if (!hasFile || fileType !== "image") return false;

  const ocrKeywords = [
    "ekstrak text",
    "extract text",
    "baca text",
    "read text",
    "tulisan",
    "tertulis",
    "what does it say",
    "apa tulisannya",
    "text di gambar",
    "text in image",
    "ocr",
  ];

  return ocrKeywords.some((keyword) => text.includes(keyword));
}

function detectImageDescription(text, hasFile, fileType) {
  if (!hasFile || fileType !== "image") return false;

  const descKeywords = [
    "apa ini",
    "what is this",
    "ini apa",
    "gambar apa",
    "jelaskan gambar",
    "describe",
    "apa yang ada",
    "ada apa",
    "what's in",
    "analyze",
    "analisis gambar",
  ];

  return descKeywords.some((keyword) => text.includes(keyword));
}

function detectAudioTranscription(text, hasFile, fileType) {
  if (fileType === "audio" || fileType === "voice") return true;

  const audioKeywords = [
    "transkrip",
    "transcribe",
    "transcript",
    "tulis audio",
    "audio ke text",
    "voice to text",
    "apa yang dikatakan",
    "what did they say",
    "dengarkan",
    "listen",
  ];

  return audioKeywords.some((keyword) => text.includes(keyword));
}

function detectImageGeneration(text) {
  const imageGenKeywords = [
    "buatin gambar",
    "bikin gambar",
    "generate gambar",
    "buat gambar",
    "gambarkan",
    "generate image",
    "create image",
    "make image",
    "draw",
    "lukis",
    "img ",
    "image ",
    "/img",
    ".img",
    "!img",
  ];

  return imageGenKeywords.some((keyword) => text.includes(keyword));
}

function detectPDFProcessing(text, hasFile, fileType) {
  if (!hasFile || fileType !== "pdf") return false;

  const pdfKeywords = [
    "pdf",
    "halaman",
    "page",
    "dokumen",
    "document",
    "cari",
    "search",
    "temukan",
    "find",
  ];

  return (
    pdfKeywords.some((keyword) => text.includes(keyword)) ||
    text.includes("apa isi") ||
    text.includes("tentang apa")
  );
}

function detectSearch(text, hasFile) {
  const searchKeywords = [
    "cari",
    "search",
    "temukan",
    "find",
    "carikan",
    "mana yang",
    "where is",
    "dimana",
  ];

  return searchKeywords.some((keyword) => text.includes(keyword));
}

function detectComparison(text, fileCount) {
  if (!fileCount || fileCount < 2) return false;

  const compareKeywords = [
    "bandingkan",
    "compare",
    "beda",
    "difference",
    "sama atau beda",
    "similarities",
    "perbandingan",
    "mana yang lebih",
    "which is better",
  ];

  return compareKeywords.some((keyword) => text.includes(keyword));
}

function detectURLProcessing(text) {
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const hasURL = urlPattern.test(text);

  if (!hasURL) return false;

  const urlKeywords = [
    "baca",
    "read",
    "rangkum",
    "summarize",
    "buka",
    "open",
    "apa isi",
    "what's in",
    "extract",
    "download",
  ];

  return hasURL || urlKeywords.some((keyword) => text.includes(keyword));
}

function detectCodeGeneration(text) {
  const codeKeywords = [
    "buatin code",
    "bikin code",
    "buat code",
    "generate code",
    "coding",
    "program",
    "function",
    "script",
    "algorithm",
    "code untuk",
    "code to",
    "implement",
  ];

  return codeKeywords.some((keyword) => text.includes(keyword));
}

function detectGenericFileIntent(text) {
  const fileActions = [
    "ini apa",
    "what is this",
    "tentang apa",
    "apa isi",
    "process",
    "analyze",
    "check",
    "lihat",
    "view",
  ];

  return fileActions.some((action) => text.includes(action));
}

function detectQuestion(text) {
  const questionWords = [
    "apa",
    "what",
    "siapa",
    "who",
    "dimana",
    "where",
    "kapan",
    "when",
    "kenapa",
    "why",
    "bagaimana",
    "how",
    "berapa",
    "how many",
    "how much",
  ];

  const hasQuestionWord = questionWords.some((word) => text.startsWith(word));
  const hasQuestionMark = text.includes("?");

  return hasQuestionWord || hasQuestionMark;
}

function detectWebSearch(text) {
  const searchKeywords = [
    "cari di google",
    "search google",
    "cari di web",
    "search web",
    "browse",
    "cari info",
    "cari informasi",
    "search for",
    "find on web",
    "look up",
    "search online",
  ];

  if (text.startsWith("cari ") || text.startsWith("search ")) {
    return true;
  }

  return searchKeywords.some((keyword) => text.includes(keyword));
}

function detectRealtimeData(text) {
  const realtimeKeywords = [
    "berita",
    "news",
    "latest news",
    "breaking news",
    "cuaca",
    "weather",
    "temperature",
    "waktu",
    "time",
    "jam berapa",
    "what time",
    "harga",
    "price",
    "stock",
    "crypto",
    "bitcoin",
    "kurs",
    "exchange rate",
    "nilai tukar",
  ];

  return realtimeKeywords.some((keyword) => text.includes(keyword));
}

// ==================== PARAMETER PARSERS ====================

function parseReminderParams(text) {
  const segments = splitReminderCommands(text);
  const reminders = segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      // Ensure each segment starts with "ingetin" to keep parsing consistent
      const normalized = segment.startsWith("ingetin")
        ? segment
        : `ingetin ${segment}`;
      return parseSingleReminder(normalized);
    })
    .filter((parsed) => parsed !== null);

  if (reminders.length === 0) {
    return { time: null, message: null };
  }

  if (reminders.length === 1) {
    return reminders[0];
  }

  return { multi: reminders };
}

function splitReminderCommands(text) {
  const cleaned = text.trim();
  if (!cleaned) return [];

  const separators = /\b(?:dan|and)\s+ingetin\b/;

  if (!separators.test(cleaned)) {
    return [cleaned];
  }

  const parts = [];
  let remaining = cleaned;

  while (separators.test(remaining)) {
    const match = remaining.match(separators);
    if (!match) break;

    const index = match.index;
    const before = remaining.slice(0, index).trim();
    if (before) {
      parts.push(before);
    }

    remaining = `ingetin ${remaining.slice(index + match[0].length).trim()}`;
  }

  if (remaining.trim()) {
    parts.push(remaining.trim());
  }

  return parts;
}

function parseSingleReminder(text) {
  const chronoResult = chrono.parse(text, new Date(), { forwardDate: true });

  const first = chronoResult[0];
  const result = {
    time: first ? first.start.date() : null,
    message: null,
    recurring: false,
    intervalMs: null,
    original: text,
  };

  const recurringRegex = /(setiap|every)\s+(\d+)?\s*(detik|second|seconds?|menit|minute|minutes|jam|hour|hours?|hari|day|days)/i;
  const recurringMatch = text.match(recurringRegex);

  if (recurringMatch) {
    const number = parseInt(recurringMatch[2] || "1", 10);
    const unit = recurringMatch[3];
    const intervalMs = getIntervalMs(number, unit);

    if (intervalMs) {
      result.recurring = true;
      result.intervalMs = intervalMs;
    }

    if (!result.time) {
      result.time = recurringMatch[0];
    }
  }

  let message = text.replace(/^ingetin\s*/i, "");

  if (first && first.text) {
    message = message.replace(first.text, "");
  }

  if (recurringMatch) {
    message = message.replace(
      new RegExp(escapeRegExp(recurringMatch[0]), "i"),
      "",
    );
  }

  message = message.replace(/\s+/g, " ").trim();

  result.message = message || "Reminder";

  return result;
}

function parseTranslationParams(text) {
  const params = {
    targetLang: "english",
    sourceText: "",
  };

  // Detect target language
  const langMatch = text.match(/ke (\w+)|to (\w+)|in (\w+)/i);
  if (langMatch) {
    params.targetLang = langMatch[1] || langMatch[2] || langMatch[3];
  }

  // Extract text in quotes
  const quoteMatch = text.match(/"([^"]+)"|'([^']+)'/);
  if (quoteMatch) {
    params.sourceText = quoteMatch[1] || quoteMatch[2];
  } else {
    // Take everything after "translate" keyword
    params.sourceText = text
      .replace(/translate|terjemahkan|bahasa/gi, "")
      .replace(/ke \w+|to \w+/gi, "")
      .trim();
  }

  return params;
}

function parseStickerParams(text, hasFile, fileType) {
  const params = {
    type: "text",
    text: null,
    style: "default",
    position: "center",
  };

  if (hasFile && fileType === "image") {
    params.type = "image";

    // Check if text overlay is needed
    const textMatch = text.match(
      /dengan text ["']([^"']+)["']|text ["']([^"']+)["']/i,
    );
    if (textMatch) {
      params.type = "image-text";
      params.text = textMatch[1] || textMatch[2];
    }
  } else {
    // Text sticker
    const textMatch = text.match(/["']([^"']+)["']|stiker (.+)/i);
    if (textMatch) {
      params.text = textMatch[1] || textMatch[2];
    } else {
      params.text = text
        .replace(/buatin stiker|bikin stiker|stiker/gi, "")
        .trim();
    }
  }

  // Detect style
  if (text.includes("dark")) params.style = "dark";
  if (text.includes("light")) params.style = "light";

  return params;
}

function parsePDFParams(text) {
  const params = {
    action: "summarize",
    pageNumber: null,
    searchTerm: null,
  };

  // Detect page number
  const pageMatch = text.match(/halaman (\d+)|page (\d+)/i);
  if (pageMatch) {
    params.action = "extract_page";
    params.pageNumber = parseInt(pageMatch[1] || pageMatch[2]);
  }

  // Detect search
  const searchMatch = text.match(
    /cari ["']([^"']+)["']|search ["']([^"']+)["']/i,
  );
  if (searchMatch) {
    params.action = "search";
    params.searchTerm = searchMatch[1] || searchMatch[2];
  }

  return params;
}

function parseSearchParams(text) {
  const params = {
    query: "",
  };

  const searchMatch = text.match(
    /cari ["']([^"']+)["']|search ["']([^"']+)["']/i,
  );
  if (searchMatch) {
    params.query = searchMatch[1] || searchMatch[2];
  } else {
    params.query = text.replace(/cari|search|temukan|find/gi, "").trim();
  }

  return params;
}

function parseURLParams(text) {
  const params = {
    url: "",
    action: "read",
  };

  const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    params.url = urlMatch[1];
  }

  if (text.includes("rangkum") || text.includes("summarize")) {
    params.action = "summarize";
  }

  return params;
}

function parseWebSearchParams(text) {
  const params = {
    query: "",
    numResults: 5,
  };

  // Remove search keywords
  let query = text;

  if (query.startsWith("cari ")) {
    query = query.slice(5);
  } else if (query.startsWith("search ")) {
    query = query.slice(7);
  }

  query = query
    .replace(
      /cari di google|search google|google|cari di web|search web|browse/gi,
      "",
    )
    .replace(/cari info|cari informasi|search for|find on web|look up/gi, "")
    .trim();

  params.query = query;

  return params;
}

function parseRealtimeParams(text) {
  const params = {
    type: "general",
    query: text,
  };

  // Detect specific types
  if (text.includes("berita") || text.includes("news")) {
    params.type = "news";
    params.topic = text.replace(/berita|news|latest|breaking/gi, "").trim();
  } else if (text.includes("cuaca") || text.includes("weather")) {
    params.type = "weather";
    params.location = text.replace(/cuaca|weather|di|in|at/gi, "").trim();
  } else if (
    text.includes("waktu") ||
    text.includes("time") ||
    text.includes("jam berapa")
  ) {
    params.type = "time";
    params.location = text
      .replace(/waktu|time|jam berapa|what time|di|in/gi, "")
      .trim();
  } else if (
    text.includes("harga") ||
    text.includes("price") ||
    text.includes("stock") ||
    text.includes("crypto")
  ) {
    params.type = "price";
    params.symbol = text
      .replace(/harga|price|stock|crypto|of|untuk/gi, "")
      .trim();
  }

  return params;
}

function parseImageGenerationParams(text) {
  const params = {
    prompt: "",
    style: "realistic",
    count: 1,
  };

  // Remove image generation keywords to get the actual prompt
  let cleanPrompt = text
    .replace(
      /buatin gambar|bikin gambar|generate gambar|buat gambar|gambarkan/gi,
      "",
    )
    .replace(/generate image|create image|make image|draw|lukis/gi, "")
    .replace(/\/img|\.img|!img|img /gi, "")
    .trim();

  // Detect style preferences
  if (cleanPrompt.includes("anime") || cleanPrompt.includes("manga")) {
    params.style = "anime";
  } else if (
    cleanPrompt.includes("kartun") ||
    cleanPrompt.includes("cartoon")
  ) {
    params.style = "cartoon";
  } else if (
    cleanPrompt.includes("seni") ||
    cleanPrompt.includes("artistic") ||
    cleanPrompt.includes("lukisan")
  ) {
    params.style = "artistic";
  } else if (cleanPrompt.includes("digital art")) {
    params.style = "digital";
  } else if (
    cleanPrompt.includes("foto") ||
    cleanPrompt.includes("photo") ||
    cleanPrompt.includes("realistic")
  ) {
    params.style = "realistic";
  }

  // Remove style keywords from prompt
  cleanPrompt = cleanPrompt
    .replace(
      /anime|manga|kartun|cartoon|seni|artistic|lukisan|digital art|foto|photo|realistic/gi,
      "",
    )
    .trim();

  // Check if multiple images requested
  const countMatch = cleanPrompt.match(/(\d+)\s*(gambar|image|buah)/i);
  if (countMatch) {
    params.count = Math.min(parseInt(countMatch[1]), 3); // Max 3 images
    cleanPrompt = cleanPrompt.replace(/\d+\s*(gambar|image|buah)/gi, "").trim();
  }

  params.prompt = cleanPrompt;

  return params;
}

function parseDeleteReminderParams(text) {
  const params = {
    index: null,
    all: false,
  };

  // Check if deleting all reminders
  if (text.includes("semua") || text.includes("all")) {
    params.all = true;
    return params;
  }

  // Extract reminder number/index
  const numberMatch = text.match(/(?:reminder\s+)?(?:nomor\s+)?(\d+)/i);
  if (numberMatch) {
    params.index = parseInt(numberMatch[1]);
  }

  return params;
}

function parseEditReminderParams(text) {
  const params = {
    index: null,
    newTask: "",
  };

  // Extract reminder number
  const numberMatch = text.match(/(?:reminder\s+)?(?:nomor\s+)?(\d+)/i);
  if (numberMatch) {
    params.index = parseInt(numberMatch[1]);
  }

  // Extract new task (text in quotes or after "jadi" or "to")
  const quoteMatch = text.match(/["'"](.+?)["'"]/);
  if (quoteMatch) {
    params.newTask = quoteMatch[1];
  } else {
    // Try to find text after "jadi" or "to"
    const jadiMatch = text.match(/(?:jadi|to|menjadi)\s+(.+)/i);
    if (jadiMatch) {
      params.newTask = jadiMatch[1];
    }
  }

  return params;
}

module.exports = {
  detectIntent,
  detectReminder,
  detectTranslation,
  detectSummarization,
  detectStickerCreation,
  detectImageGeneration,
  detectOCR,
  detectImageDescription,
  detectAudioTranscription,
  detectListReminders,
  detectDeleteReminder,
  detectEditReminder,
};
