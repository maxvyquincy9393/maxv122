
async function handleHelp(isGroup = false) {
    const prefix = isGroup ? '@' : '/';
    
    return `🤖 *MAXVY JARVIS AI*

📅 *REMINDERS*
${prefix}newreminder "Task jam HH:MM"
${prefix}listreminder
${prefix}editreminder <num> "Task baru"
${prefix}delreminder <num>

🧠 *AI FEATURES*
${prefix}ai <prompt>
${prefix}translate <lang> "text"
${prefix}summarize <text|url>
${prefix}rewrite [style] "text"
${prefix}caption <topic>
${prefix}idea <topic>
${prefix}code "task"

🎨 *MEDIA*
${prefix}img <prompt>
Kirim voice note → Auto transcription

💾 *MEMORY*
${prefix}setpersona "description"
${prefix}addnote "text"
${prefix}mynotes

📚 *KNOWLEDGE BASE*
${prefix}rag add "text"
${prefix}rag pdf <url>
${prefix}rag ask <question>
${prefix}rag clear

${isGroup ? '💬 Di grup: tag @bot atau gunakan perintah dengan @\n' : '💬 Chat biasa juga akan dijawab AI!\n'}Type ${prefix}help untuk menu ini.`
}

module.exports = { handleHelp }
