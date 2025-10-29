async function handleHelp(isGroup = false) {
  return `🤖 *Max - AI Assistant Bot*
_Developed by maxvy.ai_

⚡ *Gunakan prefix untuk chat:* . ! atau /
Contoh: .ai siapa namamu?

Berikut kemampuan saya:

━━━━━━━━━━━━━━━━━━━━━━
⏰ *REMINDER SYSTEM*
━━━━━━━━━━━━━━━━━━━━━━

📌 *One-Time Reminders:*
/newreminder "Task jam HH:MM"
Example: /newreminder "Meeting jam 14:30"

🔄 *Recurring Reminders:*
• Every X minutes:
  .ingetin setiap 30 menit minum air

• Every X hours:
  .ingetin setiap 2 jam break

• Daily at specific time:
  .ingetin setiap hari jam 06:00 olahraga

📋 *Kelola Reminders:*
.listreminder
  Lihat semua reminder kamu

.delreminder <nomor>
  Hapus reminder tertentu
  Contoh: .delreminder 2

.delreminder semua
  Hapus semua reminder

.editreminder <nomor> "task baru"
  Edit reminder tertentu
  Contoh: .editreminder 1 "Meeting jam 3"

━━━━━━━━━━━━━━━━━━━━━━
🧠 *AI CAPABILITIES*
━━━━━━━━━━━━━━━━━━━━━━

/ai <query>
  General AI assistant for any question

/translate <language> "text"
  Translate text to any language

/summarize <text|url>
  Summarize long text or web articles

/rewrite [formal|casual|brief|long] "text"
  Rewrite text in different styles

/caption <topic>
  Generate social media captions

/idea <topic>
  Brainstorm creative content ideas

/code "task in language"
  Generate code with explanation

━━━━━━━━━━━━━━━━━━━━━━
🎨 *MEDIA & FILE PROCESSING*
━━━━━━━━━━━━━━━━━━━━━━

🖼️ *Generate Gambar AI:*
/img <deskripsi>
  Buat gambar dari deskripsi text
  Contoh: .img kucing lucu di taman

🎤 *Audio Features:*
📥 Kirim voice note
  Auto transcribe ke text + AI response
🎙️ /tts "text"
  Convert text jadi suara (Text-to-Speech)
  Contoh: /tts "Hello world"

👁️ *Vision AI (Baca Gambar & Video):*
📸 Kirim foto + "apa ini?"
  Max akan jelaskan gambar
📝 Kirim foto + "baca text"
  Extract text dari gambar (OCR)
🎥 Kirim video + "apa yang terjadi?"
  Analyze video content

📄 *Sticker Maker:*
Kirim gambar + caption /sticker
  Convert gambar jadi sticker WhatsApp

🎭 *Meme Generator:*
/meme "text atas" "text bawah"
  Kirim gambar + caption untuk buat meme
  Contoh: Kirim foto + /meme "When coding" "Works first try"

━━━━━━━━━━━━━━━━━━━━━━
💾 *MEMORY & PERSONALIZATION*
━━━━━━━━━━━━━━━━━━━━━━

/setpersona "description"
  Set your personal profile for better AI responses

/addnote "text"
  Save important notes

/mynotes
  View all your saved notes

━━━━━━━━━━━━━━━━━━━━━━
📚 *KNOWLEDGE BASE (RAG)*
━━━━━━━━━━━━━━━━━━━━━━

/rag add "information"
  Add text to knowledge base

/rag pdf <url>
  Add PDF document to knowledge base

/rag local <filename>
  Add local document from docs folder

/rag ingest
  Process all documents in docs folder

/rag ask <question>
  Ask questions based on your knowledge base

/rag sources
  View all knowledge sources

/rag clear
  Clear entire knowledge base

━━━━━━━━━━━━━━━━━━━━━━

💡 *CARA PAKAI:*
• Gunakan prefix: . ! atau /
• Contoh: .ai siapa namamu?
• Contoh: /help untuk bantuan

*CONTOH COMMAND:*
.ai apa itu AI?
.img kucing lucu
.newreminder "Meeting jam 14:30"
.listreminder
Kirim foto + /sticker
Kirim foto + /meme "text atas" "text bawah"
🎤 Kirim voice note (auto transcribe!)

👤 *ADMIN COMMANDS*:
/start - Activate bot
/stop - Deactivate bot
/status - Check bot status

━━━━━━━━━━━━━━━━━━━━━━
Ketik .help kapan saja untuk melihat menu ini.

_Max siap membantu! 🚀_
`;
}

module.exports = { handleHelp };
