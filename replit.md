# MAXVY JARVIS AI - WhatsApp Bot

## Project Overview
A powerful WhatsApp bot powered by Baileys, Gemini AI, and Hugging Face. The bot provides AI assistance, reminders, image generation, voice transcription, memory system, and knowledge base features.

## Project Type
Console-based WhatsApp bot application (no web server)

## Architecture
- **Platform**: Node.js 18+
- **WhatsApp Integration**: Baileys library
- **AI Services**: 
  - Google Gemini API (required)
  - Hugging Face (optional, for images and voice)
- **Storage**: Local JSON files for reminders, memory, and knowledge base
- **Scheduler**: node-cron for reminder notifications

## Project Structure
```
.
├── handlers/          # Command handlers
│   ├── ai.js         # AI features (chat, translate, summarize, etc.)
│   ├── reminder.js   # Reminder management
│   ├── media.js      # Image generation & voice transcription
│   ├── memory.js     # User memory and persona
│   ├── rag.js        # Knowledge base (RAG)
│   └── help.js       # Help menu
├── services/         # External API integrations
│   ├── gemini.js     # Gemini API client
│   └── huggingface.js # Hugging Face API client
├── utils/            # Utilities
│   ├── helpers.js    # Helper functions
│   └── commandLoader.js # Command loader
├── storage.js        # Data storage management
└── index.js          # Main bot entry point
```

## Environment Setup
Required environment variables:
- `GEMINI_API_KEY` - Google Gemini API key (required)
- `HF_TOKEN` - Hugging Face token (optional, for image/voice features)

## Recent Changes
- **Oct 28, 2025**: Initial import and setup in Replit environment
  - Upgraded Node.js from v18 to v20 (required for newer dependencies)
  - Installed all dependencies successfully
  - Added auth_info_baileys/ to .gitignore
  - Configured workflow for console output
  - Set up environment variable management (GEMINI_API_KEY, HF_TOKEN)
  - Fixed missing storage.js import in utils/helpers.js
  - Bot starts successfully but experiencing WhatsApp connection issues (known Baileys library limitation in cloud environments)

## How to Use
1. Ensure API keys are configured via Replit Secrets
2. Run the bot using the configured workflow
3. Scan the QR code with WhatsApp to authenticate
4. Send `/help` in WhatsApp to see available commands

## Key Features
- AI chat, translation, summarization
- Smart reminders with flexible time formats
- Image generation (Stable Diffusion)
- Voice transcription (Whisper)
- User memory and persona
- Knowledge base with RAG support

## User Preferences
(None set yet)
