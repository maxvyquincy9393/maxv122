// === MAXVY JARVIS AI REMINDER BOT ===
// Author: Max Quincy

const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const pino = require('pino')
const cron = require('node-cron')
const moment = require('moment')
const qrcode = require('qrcode-terminal')

const { reminders, initStorage } = require('./storage')
const { extractText } = require('./utils/helpers')
const { loadCommands } = require('./utils/commandLoader')

const { handleNewReminder, handleListReminder, handleEditReminder, handleDeleteReminder } = require('./handlers/reminder')
const { handleAI, handleTranslate, handleSummarize, handleRewrite, handleCaption, handleIdea, handleCode } = require('./handlers/ai')
const { handleRagAdd, handleRagPdf, handleRagLocal, handleRagIngest, handleRagAsk, handleRagSources, handleRagClear } = require('./handlers/rag')
const { handleImage, handleVoiceNote } = require('./handlers/media')
const { handleSetPersona, handleAddNote, handleMyNotes } = require('./handlers/memory')
const { handleHelp } = require('./handlers/help')

// Global bot instance
let sock = null

// Validate environment variables
const validateEnv = () => {
    const required = ['GEMINI_API_KEY']
    const missing = required.filter(key => !process.env[key])
    if (missing.length > 0) {
        console.error(`❌ Missing environment variables: ${missing.join(', ')}`)
        console.error('Please create a .env file with required keys')
        process.exit(1)
    }
}

// Command map
let commandMap = null

// Initialize WhatsApp connection
const startBot = async () => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

        sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' })
        })

        // Save credentials on update
        sock.ev.on('creds.update', saveCreds)

        // Connection update handler
        sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
            if (qr) {
                console.log('\n📱 Scan QR code di bawah ini dengan WhatsApp:')
                qrcode.generate(qr, { small: true })
            }
            if (connection === 'open') {
                console.log('✅ Bot connected successfully')
            } else if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 403
                console.log('⚠️ Connection closed:', lastDisconnect?.error?.message)
                if (shouldReconnect) {
                    console.log('🔄 Attempting to reconnect...')
                    setTimeout(() => startBot(), 3000)
                }
            }
        })

        // Handle messages
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return

            for (const msg of messages) {
                try {
                    if (!msg.message || msg.key.fromMe) continue

                    const sender = msg.key.remoteJid
                    const isGroup = sender.endsWith('@g.us')
                    let text = await extractText(msg)

                    let response = null

                    // Voice note handling
                    if (msg.message.audioMessage?.ptt) {
                        response = await handleVoiceNote(sock, msg, sender)
                    }
                    // Text command handling
                    else if (text) {
                        // Normalize prefix: @ for groups, / for private
                        if (isGroup && text.startsWith('@')) {
                            text = text.replace(/^@/, '/')
                        }

                        const args = text.split(/\s+/)
                        const command = args[0].toLowerCase()

                        if (commandMap.has(command)) {
                            const handler = commandMap.get(command)
                            if (typeof handler === 'function') {
                                if (command === '/help') {
                                    response = await handler(isGroup)
                                } else {
                                    response = await handler(sock, msg, sender, text)
                                }
                            } else if (typeof handler === 'object') {
                                const subCommand = args[1]?.toLowerCase()
                                if (subCommand && handler[subCommand]) {
                                    response = await handler[subCommand](sock, msg, sender, text)
                                } else {
                                    const prefix = isGroup ? '@' : '/'
                                    response = `❌ Perintah tidak valid. Ketik ${prefix}help untuk melihat menu.`
                                }
                            }
                        }
                        // If not a command and private chat, respond with AI
                        else if (!isGroup && !text.startsWith('/') && !text.startsWith('@')) {
                            const { handleAI } = require('./handlers/ai')
                            response = await handleAI(sock, msg, sender, `/ai ${text}`)
                        }
                    }

                    // Send response if any
                    if (response) {
                        await sock.sendMessage(msg.key.remoteJid, { text: response })
                    }
                } catch (err) {
                    console.error('Error handling message:', err.message)
                    try {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: '❌ Maaf, terjadi error. Coba lagi ya.'
                        })
                    } catch (sendErr) {
                        console.error('Failed to send error message:', sendErr.message)
                    }
                }
            }
        })
    } catch (err) {
        console.error('❌ Failed to start bot:', err.message)
        process.exit(1)
    }
}

// Initialize reminder scheduler
const startScheduler = () => {
    cron.schedule('* * * * *', async () => {
        const now = moment()

        for (const reminder of reminders) {
            const [minute, hour] = reminder.cronTime.split(' ')
            if (now.hour() === parseInt(hour) && now.minute() === parseInt(minute)) {
                try {
                    await sock.sendMessage(reminder.sender, {
                        text: `⏰ Reminder: ${reminder.task}`
                    })
                } catch (err) {
                    console.error('Error sending reminder:', err)
                }
            }
        }
    })
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...')
    if (sock) {
        sock.end()
    }
    process.exit(0)
})

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...')
    if (sock) {
        sock.end()
    }
    process.exit(0)
})

// Start the bot
const main = async () => {
    console.log('🚀 Starting MAXVY JARVIS AI...')
    validateEnv()
    await initStorage()
    commandMap = loadCommands()
    console.log(`📋 Loaded ${commandMap.size} commands`)
    await startBot()
    startScheduler()
    console.log('⏰ Reminder scheduler started')
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message)
    process.exit(1)
})