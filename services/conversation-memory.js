// === ENHANCED CONVERSATION MEMORY SERVICE ===
// Advanced memory management for continuous conversations

const fs = require("fs").promises;
const path = require("path");

// Conversation storage
const conversations = new Map();
const userPreferences = new Map();
const contextStore = new Map();

// Configuration
const CONFIG = {
  MAX_HISTORY: 20, // Keep last 20 messages per user
  MAX_CONTEXT_LENGTH: 50, // Maximum messages in context window
  CONTEXT_EXPIRY_MS: 7200000, // 2 hours
  CLEANUP_INTERVAL_MS: 1800000, // 30 minutes
  PERSISTENCE_INTERVAL_MS: 300000, // 5 minutes
  MEMORY_FILE: "./data/conversation_memory.json",
  PREFERENCES_FILE: "./data/user_preferences.json",
};

// Message types
const MessageRole = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
  CONTEXT: "context",
  FILE: "file",
  ERROR: "error",
};

/**
 * Conversation class to manage individual user conversations
 */
class Conversation {
  constructor(userId) {
    this.userId = userId;
    this.messages = [];
    this.context = {};
    this.lastActivity = Date.now();
    this.sessionData = {};
    this.activeFiles = [];
    this.topics = new Set();
    this.metadata = {
      created: Date.now(),
      messageCount: 0,
      lastTopic: null,
      language: null,
      sentiment: "neutral",
    };
  }

  /**
   * Add a message to conversation history
   */
  addMessage(role, content, metadata = {}) {
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        tokens: content ? content.split(/\s+/).length : 0,
      },
    };

    this.messages.push(message);
    this.lastActivity = Date.now();
    this.metadata.messageCount++;

    // Extract topics from user messages
    if (role === MessageRole.USER) {
      this.extractTopics(content);
    }

    // Maintain message limit
    if (this.messages.length > CONFIG.MAX_HISTORY) {
      // Keep important messages (system, context) and recent ones
      const importantMessages = this.messages.filter(
        (m) => m.role === MessageRole.SYSTEM || m.role === MessageRole.CONTEXT,
      );
      const recentMessages = this.messages.slice(-CONFIG.MAX_HISTORY);

      // Combine and deduplicate
      const messageIds = new Set();
      this.messages = [...importantMessages, ...recentMessages].filter((m) => {
        if (messageIds.has(m.id)) return false;
        messageIds.add(m.id);
        return true;
      });
    }

    return message.id;
  }

  /**
   * Get conversation history with filtering
   */
  getHistory(options = {}) {
    const {
      includeSystem = true,
      includeContext = true,
      limit = CONFIG.MAX_HISTORY,
      since = null,
    } = options;

    let messages = [...this.messages];

    // Filter by time if specified
    if (since) {
      messages = messages.filter((m) => m.timestamp > since);
    }

    // Filter by role
    if (!includeSystem) {
      messages = messages.filter((m) => m.role !== MessageRole.SYSTEM);
    }
    if (!includeContext) {
      messages = messages.filter((m) => m.role !== MessageRole.CONTEXT);
    }

    // Apply limit
    if (limit && messages.length > limit) {
      messages = messages.slice(-limit);
    }

    return messages;
  }

  /**
   * Get formatted context for AI
   */
  getFormattedContext(currentMessage = "", replyTo = null) {
    const history = this.getHistory({ limit: 10 });
    let context = [];

    // Add reply context if exists
    if (replyTo) {
      context.push({
        role: MessageRole.CONTEXT,
        content: `[Replying to: "${replyTo}"]`,
      });
    }

    // Add active file context
    if (this.activeFiles.length > 0) {
      const fileContext = this.activeFiles
        .map(
          (f) =>
            `${f.type} file: ${f.name || "unnamed"} (${f.summary || "no summary"})`,
        )
        .join(", ");
      context.push({
        role: MessageRole.CONTEXT,
        content: `[Active files: ${fileContext}]`,
      });
    }

    // Add conversation history
    context = [...context, ...history];

    // Format for AI prompt
    let prompt = "";

    if (context.length > 0) {
      prompt += "=== Conversation Context ===\n";
      context.forEach((msg) => {
        const role =
          msg.role === MessageRole.USER
            ? "User"
            : msg.role === MessageRole.ASSISTANT
              ? "Assistant"
              : msg.role === MessageRole.CONTEXT
                ? "Context"
                : "System";
        prompt += `${role}: ${msg.content}\n`;
      });
      prompt += "\n=== Current Message ===\n";
    }

    prompt += `User: ${currentMessage}`;

    return prompt;
  }

  /**
   * Extract topics from message content
   */
  extractTopics(content) {
    // Simple topic extraction - can be enhanced with NLP
    const keywords = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .filter(
        (word) => !["untuk", "adalah", "dengan", "yang", "dari"].includes(word),
      );

    keywords.forEach((keyword) => {
      this.topics.add(keyword);
    });

    // Keep only recent topics
    if (this.topics.size > 50) {
      const topicsArray = Array.from(this.topics);
      this.topics = new Set(topicsArray.slice(-50));
    }
  }

  /**
   * Set active file for context
   */
  setActiveFile(fileData) {
    this.activeFiles.push({
      ...fileData,
      timestamp: Date.now(),
    });

    // Keep only recent files
    if (this.activeFiles.length > 5) {
      this.activeFiles = this.activeFiles.slice(-5);
    }
  }

  /**
   * Clear conversation but keep preferences
   */
  clear() {
    this.messages = [];
    this.context = {};
    this.sessionData = {};
    this.activeFiles = [];
    this.lastActivity = Date.now();
    // Keep topics and metadata for continuity
  }

  /**
   * Get conversation summary
   */
  getSummary() {
    const userMessages = this.messages.filter(
      (m) => m.role === MessageRole.USER,
    ).length;
    const assistantMessages = this.messages.filter(
      (m) => m.role === MessageRole.ASSISTANT,
    ).length;
    const recentTopics = Array.from(this.topics).slice(-5);

    return {
      totalMessages: this.messages.length,
      userMessages,
      assistantMessages,
      lastActivity: this.lastActivity,
      activeFiles: this.activeFiles.length,
      recentTopics,
      metadata: this.metadata,
    };
  }

  /**
   * Export conversation for persistence
   */
  toJSON() {
    return {
      userId: this.userId,
      messages: this.messages.slice(-10), // Keep only recent for storage
      context: this.context,
      lastActivity: this.lastActivity,
      topics: Array.from(this.topics),
      metadata: this.metadata,
    };
  }

  /**
   * Import conversation from persistence
   */
  static fromJSON(data) {
    const conv = new Conversation(data.userId);
    conv.messages = data.messages || [];
    conv.context = data.context || {};
    conv.lastActivity = data.lastActivity || Date.now();
    conv.topics = new Set(data.topics || []);
    conv.metadata = data.metadata || conv.metadata;
    return conv;
  }
}

/**
 * Get or create conversation for user
 */
function getConversation(userId) {
  if (!conversations.has(userId)) {
    conversations.set(userId, new Conversation(userId));
  }
  return conversations.get(userId);
}

/**
 * Add message to user's conversation
 */
function addToHistory(userId, role, content, metadata = {}) {
  const conversation = getConversation(userId);
  return conversation.addMessage(role, content, metadata);
}

/**
 * Get conversation context for AI
 */
function getContext(userId, options = {}) {
  const conversation = getConversation(userId);
  return conversation.getHistory(options);
}

/**
 * Get context with reply message
 */
function getContextWithReply(userId, replyMessage) {
  const conversation = getConversation(userId);
  return conversation.getFormattedContext("", replyMessage);
}

/**
 * Build context prompt for AI
 */
function buildContextPrompt(userId, currentMessage, replyMessage = null) {
  const conversation = getConversation(userId);
  return conversation.getFormattedContext(currentMessage, replyMessage);
}

/**
 * Set active file for user
 */
function setActiveFile(userId, fileData) {
  const conversation = getConversation(userId);
  conversation.setActiveFile(fileData);
}

/**
 * Get conversation summary
 */
function getSummary(userId) {
  const conversation = getConversation(userId);
  return conversation.getSummary();
}

/**
 * Clear conversation history
 */
function clearHistory(userId) {
  const conversation = getConversation(userId);
  conversation.clear();
  return true;
}

/**
 * Get last user message
 */
function getLastUserMessage(userId) {
  const conversation = getConversation(userId);
  const userMessages = conversation.messages.filter(
    (m) => m.role === MessageRole.USER,
  );

  if (userMessages.length === 0) {
    return null;
  }

  return userMessages[userMessages.length - 1].content;
}

/**
 * Get last assistant response
 */
function getLastAssistantMessage(userId) {
  const conversation = getConversation(userId);
  const assistantMessages = conversation.messages.filter(
    (m) => m.role === MessageRole.ASSISTANT,
  );

  if (assistantMessages.length === 0) {
    return null;
  }

  return assistantMessages[assistantMessages.length - 1].content;
}

/**
 * Save user preference
 */
function setUserPreference(userId, key, value) {
  if (!userPreferences.has(userId)) {
    userPreferences.set(userId, {});
  }
  const prefs = userPreferences.get(userId);
  prefs[key] = value;
  prefs.lastUpdated = Date.now();
}

/**
 * Get user preference
 */
function getUserPreference(userId, key, defaultValue = null) {
  if (!userPreferences.has(userId)) {
    return defaultValue;
  }
  const prefs = userPreferences.get(userId);
  return prefs[key] !== undefined ? prefs[key] : defaultValue;
}

/**
 * Get all user preferences
 */
function getUserPreferences(userId) {
  return userPreferences.get(userId) || {};
}

/**
 * Check if user has active conversation
 */
function hasActiveConversation(userId) {
  if (!conversations.has(userId)) {
    return false;
  }
  const conversation = conversations.get(userId);
  const now = Date.now();
  return now - conversation.lastActivity < CONFIG.CONTEXT_EXPIRY_MS;
}

/**
 * Get conversation age in minutes
 */
function getConversationAge(userId) {
  if (!conversations.has(userId)) {
    return null;
  }
  const conversation = conversations.get(userId);
  return Math.floor((Date.now() - conversation.metadata.created) / 60000);
}

/**
 * Get all active conversations
 */
function getActiveConversations() {
  const now = Date.now();
  const active = [];

  for (const [userId, conversation] of conversations.entries()) {
    if (now - conversation.lastActivity < CONFIG.CONTEXT_EXPIRY_MS) {
      active.push({
        userId,
        summary: conversation.getSummary(),
      });
    }
  }

  return active;
}

/**
 * Cleanup old conversations
 */
function cleanup() {
  const now = Date.now();
  let cleaned = 0;

  for (const [userId, conversation] of conversations.entries()) {
    // Remove inactive conversations
    if (now - conversation.lastActivity > CONFIG.CONTEXT_EXPIRY_MS * 2) {
      conversations.delete(userId);
      cleaned++;
    } else {
      // Clean up old messages in active conversations
      const oldMessageCount = conversation.messages.length;
      conversation.messages = conversation.messages.filter(
        (msg) => now - msg.timestamp < CONFIG.CONTEXT_EXPIRY_MS * 2,
      );

      if (conversation.messages.length < oldMessageCount) {
        cleaned++;
      }
    }
  }

  console.log(`🧹 Memory cleanup: ${cleaned} conversations/messages cleaned`);
  return cleaned;
}

/**
 * Save conversations to disk
 */
async function saveToFile() {
  try {
    const data = {
      conversations: {},
      preferences: {},
      metadata: {
        saved: Date.now(),
        version: "1.0",
      },
    };

    // Export conversations
    for (const [userId, conversation] of conversations.entries()) {
      // Only save active conversations
      if (hasActiveConversation(userId)) {
        data.conversations[userId] = conversation.toJSON();
      }
    }

    // Export preferences
    for (const [userId, prefs] of userPreferences.entries()) {
      data.preferences[userId] = prefs;
    }

    // Ensure directory exists
    const dir = path.dirname(CONFIG.MEMORY_FILE);
    await fs.mkdir(dir, { recursive: true });

    // Save to file
    await fs.writeFile(
      CONFIG.MEMORY_FILE,
      JSON.stringify(data, null, 2),
      "utf-8",
    );

    console.log(
      `💾 Saved ${Object.keys(data.conversations).length} conversations to disk`,
    );
    return true;
  } catch (error) {
    console.error("❌ Failed to save conversations:", error.message);
    return false;
  }
}

/**
 * Load conversations from disk
 */
async function loadFromFile() {
  try {
    const fileContent = await fs.readFile(CONFIG.MEMORY_FILE, "utf-8");
    const data = JSON.parse(fileContent);

    // Import conversations
    for (const [userId, convData] of Object.entries(data.conversations || {})) {
      const conversation = Conversation.fromJSON(convData);
      conversations.set(userId, conversation);
    }

    // Import preferences
    for (const [userId, prefs] of Object.entries(data.preferences || {})) {
      userPreferences.set(userId, prefs);
    }

    console.log(`📂 Loaded ${conversations.size} conversations from disk`);
    return true;
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("⚠️ Failed to load conversations:", error.message);
    }
    return false;
  }
}

/**
 * Get memory statistics
 */
function getStats() {
  const totalConversations = conversations.size;
  const activeConversations = getActiveConversations().length;
  let totalMessages = 0;
  let totalFiles = 0;

  for (const conversation of conversations.values()) {
    totalMessages += conversation.messages.length;
    totalFiles += conversation.activeFiles.length;
  }

  return {
    totalConversations,
    activeConversations,
    totalMessages,
    totalFiles,
    totalPreferences: userPreferences.size,
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
  };
}

// Initialize
let cleanupInterval;
let saveInterval;

/**
 * Initialize memory service
 */
async function initialize() {
  // Load saved conversations
  await loadFromFile();

  // Start cleanup interval
  cleanupInterval = setInterval(cleanup, CONFIG.CLEANUP_INTERVAL_MS);

  // Start auto-save interval
  saveInterval = setInterval(saveToFile, CONFIG.PERSISTENCE_INTERVAL_MS);

  console.log("🧠 Conversation memory service initialized");
}

/**
 * Shutdown memory service
 */
async function shutdown() {
  // Clear intervals
  if (cleanupInterval) clearInterval(cleanupInterval);
  if (saveInterval) clearInterval(saveInterval);

  // Save current state
  await saveToFile();

  console.log("🧠 Conversation memory service shut down");
}

// Auto-initialize on module load
initialize().catch(console.error);

// Cleanup on process exit
process.on("beforeExit", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = {
  // Core functions
  addToHistory,
  getContext,
  getContextWithReply,
  buildContextPrompt,
  clearHistory,
  getLastUserMessage,
  getLastAssistantMessage,

  // File management
  setActiveFile,

  // Preferences
  setUserPreference,
  getUserPreference,
  getUserPreferences,

  // Conversation management
  getConversation,
  getSummary,
  hasActiveConversation,
  getConversationAge,
  getActiveConversations,

  // Maintenance
  cleanup,
  getStats,
  saveToFile,
  loadFromFile,
  initialize,
  shutdown,

  // Classes
  Conversation,
  MessageRole,
};
