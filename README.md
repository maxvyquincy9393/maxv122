## 🤖 MAXVY JARVIS AI - WhatsApp Bot

A powerful, free-tier WhatsApp bot powered by **Baileys**, **Gemini API**, **Hugging Face**, and **node-cron**.

### ✨ Features

- **🧠 AI Assistant** - Ask questions, translate, summarize, rewrite text
- **📅 Smart Reminders** - Set, edit, and manage reminders with flexible time formats
- **🎨 Image Generation** - Generate images with AI (Stable Diffusion)
- **🎙️ Voice Transcription** - Auto-transcribe voice notes (Whisper)
- **💾 Memory System** - Store persona and notes
- **📚 Knowledge Base (RAG)** - Add documents and ask questions
- **⚡ Rate Limiting** - Built-in rate limiting for API calls

### 🚀 Quick Start

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Setup Environment
Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```

Edit `.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
HF_TOKEN=your_huggingface_token_here
```

#### 3. Get API Keys

**Gemini API** (Required):
- Go to https://makersuite.google.com/app/apikey
- Create a new API key
- Copy and paste into `.env`

**Hugging Face Token** (Optional, for images & voice):
- Go to https://huggingface.co/settings/tokens
- Create a new token
- Copy and paste into `.env`

#### 4. Run the Bot
```bash
npm start
```

Scan the QR code in terminal with WhatsApp to connect!

### Project Structure

```
.
├── handlers
│   ├── ai.js
│   ├── help.js
│   ├── media.js
│   ├── memory.js
│   ├── rag.js
│   └── reminder.js
├── services
│   ├── gemini.js
│   └── huggingface.js
├── utils
│   ├── commandLoader.js
│   └── helpers.js
├── storage.js
├── index.js
└── ...
```

### 📖 Commands Guide

Type `/help` in WhatsApp to see all commands. Here are the main ones:

#### 📅 Reminders
```
/newreminder "Belajar AI jam 20:00"    # Create reminder
/listreminder                           # Show all reminders
/editreminder 1 "Study jam 19:00"      # Edit reminder
/delreminder 1                          # Delete reminder
```

**Time Formats**: `7`, `07`, `7:30`, `7.30`, `jam 7`, `pukul 07.30`

#### 🧠 AI Features
```
/ai "Apa itu machine learning?"         # Ask AI
/translate english "Halo dunia"         # Translate
/summarize "Long text..."               # Summarize
/rewrite casual "Formal text"           # Rewrite
/caption "sunset"                       # Generate caption
/idea "content marketing"               # Get ideas
/code "fibonacci in javascript"         # Generate code
```

#### 🎨 Media
```
/img "a beautiful sunset"               # Generate image (1x/min)
Send voice note → Auto transcription    # Voice to text
```

#### 💾 Memory
```
/setpersona "I am a developer"         # Set your persona
/addnote "Remember to study"           # Add note
/mynotes                                # View all notes
```

#### 📚 Knowledge Base (RAG)
```
/rag add "Important information"        # Add text
/rag pdf https://example.com/file.pdf  # Add PDF
/rag local ./document.txt               # Add local file
/rag ingest ./docs                      # Index directory
/rag ask "What is...?"                 # Ask knowledge base
/rag sources                            # Show sources
/rag clear                              # Clear all
```

### 🔧 Troubleshooting

**Bot won't start?**
- Check `.env` file exists and has `GEMINI_API_KEY`
- Ensure Node.js version >= 18
- Run `npm install` again

**Commands not working?**
- Make sure to use quotes for multi-word inputs
- Check format with `/help`
- Ensure API keys are valid

**Image generation fails?**
- Set `HF_TOKEN` in `.env`
- Check Hugging Face token is valid
- Wait a minute before trying again (rate limit)

**Voice transcription not working?**
- Set `HF_TOKEN` in `.env`
- Send shorter audio files
- Check audio quality

### 📝 Project Structure

```
.
├── handlers/          # Command handlers
│   ├── ai.js         # AI features
│   ├── reminder.js   # Reminder management
│   ├── media.js      # Image & voice
│   ├── memory.js     # User memory
│   ├── rag.js        # Knowledge base
│   └── help.js       # Help menu
├── services/         # External APIs
│   ├── gemini.js     # Gemini API
│   └── huggingface.js # HF API
├── utils/            # Utilities
│   ├── helpers.js    # Helper functions
│   └── commandLoader.js # Command loader
├── storage.js        # Data storage
├── index.js          # Main bot file
└── package.json      # Dependencies
```

### 🛠️ Development

Run tests:
```bash
npm test
```

### 📄 License

ISC

### 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Made with ❤️ by Max Quincy**


