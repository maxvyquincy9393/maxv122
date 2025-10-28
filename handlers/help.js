
async function handleHelp() {
    return `🤖 *MAXVY JARVIS AI BOT - HELP*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 *REMINDERS*
/newreminder "Task jam HH:MM" - Create reminder
/listreminder - Show all reminders
/editreminder <num> "Task jam HH:MM" - Edit reminder
/delreminder <num> - Delete reminder

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 *AI ASSISTANT*
/ai <prompt> - Ask AI anything
/translate <lang> "text" - Translate text
/summarize <text|url> - Summarize content
/rewrite [style] "text" - Rewrite text (formal/casual/brief/long)
/caption <topic> - Generate social media caption
/idea <topic> - Get creative ideas
/code "task in <lang>" - Generate code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 *MEDIA*
/img <prompt> - Generate image (1x/min limit)
Send voice note → Auto transcription

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 *MEMORY & PROFILE*
/setpersona "description" - Set your persona
/addnote "text" - Add a note
/mynotes - View all notes & persona

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 *KNOWLEDGE BASE (RAG)*
/rag add "text" - Add text to knowledge
/rag pdf <url> - Add PDF content
/rag local <path> - Add local file
/rag ingest <dir> - Index directory
/rag ask <question> - Ask knowledge base
/rag sources - Show sources
/rag clear - Clear knowledge base

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 *TIPS*
• Use quotes for multi-word inputs
• Time formats: 7, 07, 7:30, jam 7, pukul 07.30
• Check .env.example for setup guide

Type /help anytime for this menu!`
}

module.exports = { handleHelp }
