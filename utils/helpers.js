
const { default: makeWASocket, useMultiFileAuthState, downloadContentFromMessage } = require('@adiwajshing/baileys')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { HfInference } = require('@huggingface/inference')
const cheerio = require('cheerio')
const QRCode = require('qrcode-terminal')
const pdfParse = require('pdf-parse')
const cron = require('node-cron')
const axios = require('axios')
const moment = require('moment')
const pino = require('pino')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Load environment variables
require('dotenv').config()

// Load storage
const { knowledge, saveKnowledge, getUserKnowledge } = require('../storage')

// Initialize AI clients
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const hf = new HfInference(process.env.HF_TOKEN)

// Models configuration
const HF_ASR_MODEL = process.env.HF_ASR_MODEL || 'openai/whisper-base'
const HF_EMBED_MODEL = process.env.HF_EMBED_MODEL || 'sentence-transformers/all-MiniLM-L6-v2'

// Rate limiting
const userRateLimits = new Map() // {userId: {lastCommand: timestamp}}

// Storage paths
const STORAGE = {
    reminders: './reminders.json',
    memory: './memory.json',
    knowledge: './knowledge.json',
    docs: './docs'
}

// Time parsing utility
const parseTime = (text) => {
    // Handle various time formats
    const timeFormats = [
        'H', 'HH',
        'H:mm', 'HH:mm',
        'H.mm', 'HH.mm',
        'jam H', 'jam HH',
        'pukul H', 'pukul HH',
        'jam H:mm', 'jam HH:mm',
        'pukul H:mm', 'pukul HH:mm'
    ]

    // Clean input
    text = text.toLowerCase().replace(/[.,]/g, ':')

    // Extract time part
    const timeMatch = text.match(/\d{1,2}(:\d{2})?/)
    if (!timeMatch) return null

    let time = timeMatch[0]
    if (!time.includes(':')) time += ':00'

    return moment(time, timeFormats, true)
}

// Rate limit checker
const checkRateLimit = (userId, command = 'default', minutes = 1) => {
    const now = Date.now()
    const userLimits = userRateLimits.get(userId) || {}
    const lastTime = userLimits[command]

    if (lastTime && (now - lastTime) < minutes * 60 * 1000) {
        const remainingSecs = Math.ceil((minutes * 60 * 1000 - (now - lastTime)) / 1000)
        return `Rate limit exceeded. Please wait ${remainingSecs} seconds.`
    }

    userLimits[command] = now
    userRateLimits.set(userId, userLimits)
    return null
}

// Extract clean text from message
const extractText = async (msg) => {
    if (msg?.message?.conversation) return msg.message.conversation
    if (msg?.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text
    return ''
}

// Helper to download media from message
const downloadMedia = async (msg, type) => {
    try {
        const stream = await downloadContentFromMessage(msg.message[type], type)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
    } catch (err) {
        console.error('Error downloading media:', err)
        return null
    }
}

// Cache for embeddings by content hash
const embeddingCache = new Map()

// Calculate content hash
const getContentHash = (content) => {
    return crypto.createHash('md5').update(content).digest('hex')
}

// Get embeddings with caching
const getEmbedding = async (content) => {
    const hash = getContentHash(content)

    if (embeddingCache.has(hash)) {
        return embeddingCache.get(hash)
    }

    try {
        const result = await hf.featureExtraction({
            model: HF_EMBED_MODEL,
            inputs: content
        })

        embeddingCache.set(hash, result)
        return result
    } catch (err) {
        console.error('Embedding error:', err)
        return null
    }
}

// Calculate cosine similarity
const cosineSimilarity = (v1, v2) => {
    const dotProduct = v1.reduce((acc, val, i) => acc + val * v2[i], 0)
    const v1Magnitude = Math.sqrt(v1.reduce((acc, val) => acc + val * val, 0))
    const v2Magnitude = Math.sqrt(v2.reduce((acc, val) => acc + val * val, 0))
    return dotProduct / (v1Magnitude * v2Magnitude)
}

// Extract text from PDF buffer
const extractPdfText = async (buffer) => {
    try {
        const data = await pdfParse(buffer)
        return data.text
    } catch (err) {
        console.error('PDF parsing error:', err)
        return null
    }
}

// Extract text from webpage
const extractWebText = async (url) => {
    try {
        const { data } = await axios.get(url)
        const $ = cheerio.load(data)

        // Remove scripts, styles, etc
        $('script').remove()
        $('style').remove()
        $('nav').remove()
        $('footer').remove()

        return $('body').text().trim()
    } catch (err) {
        console.error('Web scraping error:', err)
        return null
    }
}

function normalizeTimeString(raw) {
    if (!raw) return null
    let s = String(raw).toLowerCase().trim()
    s = s.replace(/pukul|jam/gi, '').trim()
    s = s.replace(/\./g, ':')
    const onlyHour = s.match(/^\d{1,2}$/)
    if (onlyHour) {
        const h = String(Number(s)).padStart(2, '0')
        return `${h}:00`
    }
    const hm = s.match(/^(\d{1,2}):(\d{2})$/)
    if (!hm) return null
    const h = Number(hm[1])
    const m = Number(hm[2])
    if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function extractTaskAndTime(input) {
    if (!input) return { task: null, time: null }
    let txt = input.replace(/["']/g, '').trim()
    const timePattern = /(\b(?:jam|pukul)?\s*(\d{1,2}(?::|\.)\d{2}|\d{1,2})\b)$/i
    const m = txt.match(timePattern)
    if (!m) return { task: null, time: null }
    const timeStr = normalizeTimeString(m[2])
    if (!timeStr) return { task: null, time: null }
    const task = txt.replace(m[0], '').replace(/\s+$/, '').replace(/\s*(?:jam|pukul)\s*$/i, '').trim()
    return { task, time: timeStr }
}

// Simple rate limiter for /img (1/min per user)
const imgRateState = new Map()
function canGenerateImageNow(userJid, windowMs = 60_000) {
    const now = Date.now()
    const last = imgRateState.get(userJid) || 0
    if (now - last < windowMs) return { ok: false, waitMs: windowMs - (now - last) }
    imgRateState.set(userJid, now)
    return { ok: true, waitMs: 0 }
}

// === Gemini Text Generation ===
async function geminiReply(prompt) {
    try {
        const res = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
            { contents: [{ parts: [{ text: prompt }] }] }
        )
        return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ Tidak ada respons dari Gemini.'
    } catch (e) {
        return '❌ Error Gemini: ' + e.message
    }
}

// === Hugging Face Image Generator ===
async function generateImage(prompt) {
    try {
        const res = await axios.post(
            'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
            { inputs: prompt },
            { headers: { Authorization: `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json' }, responseType: 'arraybuffer' }
        )
        const filename = `./img_${Date.now()}.png`
        fs.writeFileSync(filename, res.data)
        return filename
    } catch (e) {
        console.error('Error HF:', e.message)
        return null
    }
}

// === Helpers: fetch URL and clean text ===
async function fetchUrlText(url) {
    try {
        const res = await axios.get(url, { timeout: 10000 })
        const html = String(res.data)
        const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        return text.slice(0, 8000)
    } catch (e) {
        return null
    }
}

async function fetchPdfText(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 })
        const data = await pdfParse(res.data)
        return String(data.text || '').slice(0, 20000)
    } catch (e) {
        return null
    }
}

// Local file readers for RAG
async function readLocalFileText(targetPath) {
    try {
        const abs = path.resolve(process.cwd(), targetPath)
        const stat = fs.statSync(abs)
        if (!stat.isFile()) return null
        const ext = path.extname(abs).toLowerCase()
        if (ext === '.pdf') {
            const buf = fs.readFileSync(abs)
            const data = await pdfParse(buf)
            return String(data.text || '')
        }
        // default text-like
        return fs.readFileSync(abs, 'utf8')
    } catch (e) {
        return null
    }
}

async function ingestDirectory(user, dirPath) {
    try {
        const abs = path.resolve(process.cwd(), dirPath)
        const stat = fs.statSync(abs)
        if (!stat.isDirectory()) return { files: 0, chunks: 0 }
        const entries = fs.readdirSync(abs)
        let totalFiles = 0
        let totalChunks = 0
        for (const name of entries) {
            const fp = path.join(abs, name)
            const st = fs.statSync(fp)
            if (!st.isFile()) continue
            const ext = path.extname(fp).toLowerCase()
            if (!['.txt', '.md', '.pdf'].includes(ext)) continue
            const content = ext === '.pdf' ? (await readLocalFileText(fp)) : fs.readFileSync(fp, 'utf8')
            if (!content) continue
            const count = await upsertKnowledgeChunks(user, fp, content)
            totalFiles += 1
            totalChunks += count
        }
        return { files: totalFiles, chunks: totalChunks }
    } catch (_) {
        return { files: 0, chunks: 0 }
    }
}

function chunkText(text, maxLen = 700) {
    const sentences = String(text).split(/(?<=[.!?])\s+/)
    const chunks = []
    let buf = ''
    for (const s of sentences) {
        if ((buf + ' ' + s).trim().length > maxLen) {
            if (buf.trim()) chunks.push(buf.trim())
            buf = s
        } else {
            buf = (buf ? buf + ' ' : '') + s
        }
    }
    if (buf.trim()) chunks.push(buf.trim())
    return chunks
}
async function embedText(text) {
    const model = process.env.HF_EMBED_MODEL || 'sentence-transformers/all-MiniLM-L6-v2'
    const res = await axios.post(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`,
        text,
        { headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` }, timeout: 30000 }
    )
    // Response can be [dim] or [n][dim]; handle both
    const emb = Array.isArray(res.data?.[0]) ? res.data[0] : res.data
    return emb.map(Number)
}
function cosineSim(a, b) {
    let dot = 0, na = 0, nb = 0
    for (let i = 0; i < a.length && i < b.length; i++) {
        dot += a[i] * b[i]
        na += a[i] * a[i]
        nb += b[i] * b[i]
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8)
}
async function upsertKnowledgeChunks(user, source, text) {
    const chunks = chunkText(text)
    for (const content of chunks) {
        try {
            const embedding = await embedText(content)
            knowledge.push({ user, source, content, embedding })
        } catch (_) { /* skip on embed error */ }
    }
    saveKnowledge()
    return chunks.length
}
function searchTopK(user, queryEmbedding, k = 5) {
    const rows = getUserKnowledge(user)
    const scored = rows.map(r => ({ ...r, score: cosineSim(queryEmbedding, r.embedding || []) }))
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, k)
}

module.exports = {
    parseTime,
    checkRateLimit,
    extractText,
    downloadMedia,
    getContentHash,
    getEmbedding,
    cosineSimilarity,
    extractPdfText,
    extractWebText,
    normalizeTimeString,
    extractTaskAndTime,
    canGenerateImageNow,
    geminiReply,
    generateImage,
    fetchUrlText,
    fetchPdfText,
    readLocalFileText,
    ingestDirectory,
    chunkText,
    embedText,
    cosineSim,
    searchTopK
}
