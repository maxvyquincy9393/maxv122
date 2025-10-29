// === STORAGE SERVICE ===
// Handles data persistence for reminders and other bot data

const fs = require("fs").promises;
const path = require("path");

// Storage file paths
const STORAGE_DIR = "./data";
const REMINDERS_FILE = path.join(STORAGE_DIR, "reminders.json");
const MEMORY_FILE = path.join(STORAGE_DIR, "memory.json");
const KNOWLEDGE_FILE = path.join(STORAGE_DIR, "knowledge.json");

// In-memory storage
let reminders = {};
let memory = {};
let knowledge = {};

/**
 * Initialize storage directory and files
 */
async function initStorage() {
  try {
    // Create storage directory if it doesn't exist
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    console.log("📁 Storage directory initialized");

    // Load existing data
    await loadReminders();
    await loadMemory();
    await loadKnowledge();

    console.log("✅ Storage initialized successfully");
    console.log(
      `📋 Loaded ${Object.keys(reminders).length} user reminder sets`
    );
    console.log(`🧠 Loaded ${Object.keys(memory).length} memory entries`);
    console.log(`📚 Loaded ${Object.keys(knowledge).length} knowledge entries`);

    return true;
  } catch (error) {
    console.error("❌ Error initializing storage:", error.message);
    return false;
  }
}

/**
 * Load reminders from file
 */
async function loadReminders() {
  try {
    const data = await fs.readFile(REMINDERS_FILE, "utf-8");
    const parsed = JSON.parse(data);

    // Handle both old array format and new object format
    if (Array.isArray(parsed)) {
      // Convert old format to new format
      reminders = {};
      parsed.forEach((reminder) => {
        const userId = reminder.sender || reminder.userId;
        if (!reminders[userId]) {
          reminders[userId] = [];
        }
        reminders[userId].push({
          id: reminder.id || Date.now().toString(),
          time: reminder.time || reminder.cronTime,
          message: reminder.message || reminder.task,
          recurring: reminder.recurring || false,
          active: reminder.active !== false,
          created:
            reminder.created || reminder.createdAt || new Date().toISOString(),
        });
      });
    } else {
      reminders = parsed;
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, create empty
      reminders = {};
      await saveReminders();
    } else if (error instanceof SyntaxError) {
      console.error("⚠️ Corrupted reminders file, resetting...");
      reminders = {};
      await saveReminders();
    } else {
      throw error;
    }
  }
}

/**
 * Save reminders to file
 */
async function saveReminders() {
  try {
    await fs.writeFile(
      REMINDERS_FILE,
      JSON.stringify(reminders, null, 2),
      "utf-8"
    );
    return true;
  } catch (error) {
    console.error("❌ Error saving reminders:", error.message);
    return false;
  }
}

/**
 * Load memory from file
 */
async function loadMemory() {
  try {
    const data = await fs.readFile(MEMORY_FILE, "utf-8");
    memory = JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      memory = {};
      await saveMemory();
    } else if (error instanceof SyntaxError) {
      console.error("⚠️ Corrupted memory file, resetting...");
      memory = {};
      await saveMemory();
    } else {
      throw error;
    }
  }
}

/**
 * Save memory to file
 */
async function saveMemory() {
  try {
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("❌ Error saving memory:", error.message);
    return false;
  }
}

/**
 * Load knowledge from file
 */
async function loadKnowledge() {
  try {
    const data = await fs.readFile(KNOWLEDGE_FILE, "utf-8");
    knowledge = JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      knowledge = {};
      await saveKnowledge();
    } else if (error instanceof SyntaxError) {
      console.error("⚠️ Corrupted knowledge file, resetting...");
      knowledge = {};
      await saveKnowledge();
    } else {
      throw error;
    }
  }
}

/**
 * Save knowledge to file
 */
async function saveKnowledge() {
  try {
    await fs.writeFile(
      KNOWLEDGE_FILE,
      JSON.stringify(knowledge, null, 2),
      "utf-8"
    );
    return true;
  } catch (error) {
    console.error("❌ Error saving knowledge:", error.message);
    return false;
  }
}

/**
 * Save all data
 */
async function saveData() {
  const results = await Promise.all([
    saveReminders(),
    saveMemory(),
    saveKnowledge(),
  ]);

  const allSuccess = results.every((r) => r === true);
  if (allSuccess) {
    console.log("💾 All data saved successfully");
  } else {
    console.error("⚠️ Some data failed to save");
  }

  return allSuccess;
}

/**
 * Add a reminder for a user
 */
function addReminder(userId, reminder) {
  if (!reminders[userId]) {
    reminders[userId] = [];
  }

  const newReminder = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ...reminder,
    created: new Date().toISOString(),
    active: true,
  };

  reminders[userId].push(newReminder);
  saveReminders();

  return newReminder;
}

/**
 * Get reminders for a user
 */
function getUserReminders(userId) {
  return reminders[userId] || [];
}

/**
 * Get all active reminders
 */
function getAllActiveReminders() {
  const active = [];

  for (const [userId, userReminders] of Object.entries(reminders)) {
    const activeReminders = userReminders.filter((r) => r.active);
    activeReminders.forEach((reminder) => {
      active.push({
        ...reminder,
        userId,
      });
    });
  }

  return active;
}

/**
 * Update a reminder
 */
function updateReminder(userId, reminderId, updates) {
  if (!reminders[userId]) {
    return false;
  }

  const reminderIndex = reminders[userId].findIndex((r) => r.id === reminderId);
  if (reminderIndex === -1) {
    return false;
  }

  reminders[userId][reminderIndex] = {
    ...reminders[userId][reminderIndex],
    ...updates,
    updated: new Date().toISOString(),
  };

  saveReminders();
  return true;
}

/**
 * Delete a reminder
 */
function deleteReminder(userId, reminderId) {
  if (!reminders[userId]) {
    return false;
  }

  const initialLength = reminders[userId].length;
  reminders[userId] = reminders[userId].filter((r) => r.id !== reminderId);

  if (reminders[userId].length < initialLength) {
    saveReminders();
    return true;
  }

  return false;
}

/**
 * Clear all reminders for a user
 */
function clearUserReminders(userId) {
  if (reminders[userId]) {
    delete reminders[userId];
    saveReminders();
    return true;
  }
  return false;
}

/**
 * Get memory for a user
 */
function getUserMemory(userId) {
  return memory[userId] || {};
}

/**
 * Set memory for a user
 */
function setUserMemory(userId, key, value) {
  if (!memory[userId]) {
    memory[userId] = {};
  }
  memory[userId][key] = value;
  memory[userId].lastUpdated = new Date().toISOString();
  saveMemory();
}

/**
 * Clear memory for a user
 */
function clearUserMemory(userId) {
  if (memory[userId]) {
    delete memory[userId];
    saveMemory();
    return true;
  }
  return false;
}

/**
 * Add knowledge entry
 */
function addKnowledge(key, value, metadata = {}) {
  knowledge[key] = {
    value,
    metadata,
    added: new Date().toISOString(),
  };
  saveKnowledge();
  return true;
}

/**
 * Get knowledge entry
 */
function getKnowledge(key) {
  return knowledge[key]?.value || null;
}

/**
 * Search knowledge
 */
function searchKnowledge(query) {
  const results = [];
  const searchTerm = query.toLowerCase();

  for (const [key, entry] of Object.entries(knowledge)) {
    if (
      key.toLowerCase().includes(searchTerm) ||
      (typeof entry.value === "string" &&
        entry.value.toLowerCase().includes(searchTerm))
    ) {
      results.push({
        key,
        value: entry.value,
        metadata: entry.metadata,
      });
    }
  }

  return results;
}

/**
 * Clear all knowledge
 */
function clearKnowledge() {
  knowledge = {};
  saveKnowledge();
  return true;
}

/**
 * Get storage statistics
 */
function getStats() {
  const reminderCount = Object.values(reminders).reduce(
    (sum, userReminders) => sum + userReminders.length,
    0
  );

  const activeReminderCount = Object.values(reminders).reduce(
    (sum, userReminders) => sum + userReminders.filter((r) => r.active).length,
    0
  );

  return {
    users: {
      withReminders: Object.keys(reminders).length,
      withMemory: Object.keys(memory).length,
    },
    reminders: {
      total: reminderCount,
      active: activeReminderCount,
    },
    knowledge: {
      entries: Object.keys(knowledge).length,
    },
    storage: {
      remindersFile: REMINDERS_FILE,
      memoryFile: MEMORY_FILE,
      knowledgeFile: KNOWLEDGE_FILE,
    },
  };
}

/**
 * Backup all data
 */
async function backupData() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(STORAGE_DIR, "backups");

    await fs.mkdir(backupDir, { recursive: true });

    await Promise.all([
      fs.copyFile(
        REMINDERS_FILE,
        path.join(backupDir, `reminders_${timestamp}.json`)
      ),
      fs.copyFile(
        MEMORY_FILE,
        path.join(backupDir, `memory_${timestamp}.json`)
      ),
      fs.copyFile(
        KNOWLEDGE_FILE,
        path.join(backupDir, `knowledge_${timestamp}.json`)
      ),
    ]);

    console.log(`✅ Backup created: ${timestamp}`);
    return true;
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    return false;
  }
}

/**
 * Restore data from backup
 */
async function restoreData(timestamp) {
  try {
    const backupDir = path.join(STORAGE_DIR, "backups");

    await Promise.all([
      fs.copyFile(
        path.join(backupDir, `reminders_${timestamp}.json`),
        REMINDERS_FILE
      ),
      fs.copyFile(
        path.join(backupDir, `memory_${timestamp}.json`),
        MEMORY_FILE
      ),
      fs.copyFile(
        path.join(backupDir, `knowledge_${timestamp}.json`),
        KNOWLEDGE_FILE
      ),
    ]);

    // Reload data
    await loadReminders();
    await loadMemory();
    await loadKnowledge();

    console.log(`✅ Data restored from backup: ${timestamp}`);
    return true;
  } catch (error) {
    console.error("❌ Restore failed:", error.message);
    return false;
  }
}

// Export everything
module.exports = {
  // Core functions
  initStorage,
  saveData,

  // Reminders
  reminders,
  addReminder,
  getUserReminders,
  getAllActiveReminders,
  updateReminder,
  deleteReminder,
  clearUserReminders,

  // Memory
  memory,
  getUserMemory,
  setUserMemory,
  clearUserMemory,

  // Knowledge
  knowledge,
  addKnowledge,
  getKnowledge,
  searchKnowledge,
  clearKnowledge,

  // Utilities
  getStats,
  backupData,
  restoreData,
};
