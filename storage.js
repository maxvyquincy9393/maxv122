
const fs = require('fs').promises
const fsSync = require('fs')

// Storage paths
const STORAGE = {
    reminders: './reminders.json',
    memory: './memory.json',
    knowledge: './knowledge.json',
    docs: './docs'
}

// Load storage data
let reminders = []
let userMemory = []
let knowledge = []

// Initialize storage
const initStorage = async () => {
    try {
        // Load reminders
        if (fsSync.existsSync(STORAGE.reminders)) {
            const data = await fs.readFile(STORAGE.reminders, 'utf-8')
            reminders = data.trim() ? JSON.parse(data) : []
        } else {
            await fs.writeFile(STORAGE.reminders, JSON.stringify([], null, 2))
        }

        // Load memory
        if (fsSync.existsSync(STORAGE.memory)) {
            const data = await fs.readFile(STORAGE.memory, 'utf-8')
            userMemory = data.trim() ? JSON.parse(data) : []
        } else {
            await fs.writeFile(STORAGE.memory, JSON.stringify([], null, 2))
        }

        // Load knowledge
        if (fsSync.existsSync(STORAGE.knowledge)) {
            const data = await fs.readFile(STORAGE.knowledge, 'utf-8')
            knowledge = data.trim() ? JSON.parse(data) : []
        } else {
            await fs.writeFile(STORAGE.knowledge, JSON.stringify([], null, 2))
        }

        // Create docs directory
        if (!fsSync.existsSync(STORAGE.docs)) {
            await fs.mkdir(STORAGE.docs, { recursive: true })
        }

        console.log('✅ Storage initialized')
    } catch (err) {
        console.error('❌ Error initializing storage:', err.message)
        throw err
    }
}

// Storage helpers
const saveData = async (type, data) => {
    try {
        await fs.writeFile(STORAGE[type], JSON.stringify(data, null, 2))
    } catch (err) {
        console.error(`❌ Error saving ${type}:`, err.message)
        throw err
    }
}

// Memory management
const saveMemory = async () => {
    await saveData('memory', userMemory)
}

const getUserPersona = (user) => {
    return userMemory.find(m => m.user === user) || { user, persona: '', notes: [] }
}

const upsertUserPersona = async (user, persona) => {
    const idx = userMemory.findIndex(m => m.user === user)
    if (idx === -1) {
        userMemory.push({ user, persona, notes: [] })
    } else {
        userMemory[idx].persona = persona
    }
    await saveMemory()
}

const addUserNote = async (user, note) => {
    const idx = userMemory.findIndex(m => m.user === user)
    if (idx === -1) {
        userMemory.push({ user, persona: '', notes: [note] })
    } else {
        userMemory[idx].notes.push(note)
    }
    await saveMemory()
}

// Knowledge management
const saveKnowledge = async () => {
    await saveData('knowledge', knowledge)
}

const getUserKnowledge = (user) => {
    return knowledge.filter(k => k.user === user)
}

const getUserReminders = (userJid) => {
    return reminders.filter(r => r.sender === userJid)
}

module.exports = {
    STORAGE,
    reminders,
    userMemory,
    knowledge,
    initStorage,
    saveData,
    saveMemory,
    getUserPersona,
    upsertUserPersona,
    addUserNote,
    saveKnowledge,
    getUserKnowledge,
    getUserReminders
}
