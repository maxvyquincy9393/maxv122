# 🚀 MAXVY JARVIS AI - Setup Guide

Complete step-by-step guide to get the bot running.

## Prerequisites

- **Node.js** >= 18 (download from https://nodejs.org/)
- **npm** (comes with Node.js)
- **WhatsApp** account on your phone
- **Internet connection**

## Step 1: Clone or Download the Project

```bash
# If using git
git clone <repository-url>
cd maxvy12

# Or extract the ZIP file and navigate to it
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- `@adiwajshing/baileys` - WhatsApp connection
- `@google/generative-ai` - Gemini API
- `@huggingface/inference` - HF models
- `node-cron` - Scheduling
- And more...

## Step 3: Get API Keys

### 🔑 Gemini API Key (Required)

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Keep it safe!

### 🔑 Hugging Face Token (Optional)

For image generation and voice transcription:

1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Name it (e.g., "MAXVY Bot")
4. Select "Read" access
5. Click "Generate token"
6. Copy the token

## Step 4: Configure Environment

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` with your favorite editor:
```
GEMINI_API_KEY=your_key_here
HF_TOKEN=your_token_here
```

3. Save the file

## Step 5: Start the Bot

```bash
npm start
```

You should see:
```
🚀 Starting MAXVY JARVIS AI...
✅ Storage initialized
📋 Loaded 15 commands
```

## Step 6: Connect WhatsApp

1. A QR code will appear in the terminal
2. Open WhatsApp on your phone
3. Go to **Settings** → **Linked Devices**
4. Click **Link a Device**
5. Scan the QR code with your phone camera
6. Wait for connection to complete

You should see:
```
✅ Bot connected successfully
⏰ Reminder scheduler started
```

## Step 7: Test the Bot

Send a message to yourself (WhatsApp Web):

```
/help
```

You should get a detailed help menu!

Try a simple command:
```
/ai Hello, who are you?
```

## 🎉 Success!

Your bot is now running! Start using commands:

- `/help` - See all commands
- `/newreminder "Study jam 20:00"` - Create a reminder
- `/ai "What is AI?"` - Ask a question
- `/img "a cat"` - Generate an image (requires HF_TOKEN)

## ⚙️ Configuration

### Optional Settings in `.env`

```
# Models (defaults are fine for most users)
GEMINI_MODEL=gemini-pro
HF_ASR_MODEL=openai/whisper-base
HF_IMAGE_MODEL=stabilityai/stable-diffusion-2

# Bot settings
BOT_PREFIX=/
MAX_MESSAGE_LENGTH=4096
```

## 🔧 Troubleshooting

### "Cannot find module '@adiwajshing/baileys'"
```bash
npm install
```

### "GEMINI_API_KEY is not set"
- Check `.env` file exists
- Verify `GEMINI_API_KEY=...` is there
- No spaces around the `=` sign

### "QR code not showing"
- Make sure terminal is large enough
- Try running in a different terminal
- Check Node.js version: `node --version` (should be >= 18)

### "Bot connects but doesn't respond"
- Check API key is valid
- Try `/help` command
- Check console for errors

### "Image generation fails"
- Set `HF_TOKEN` in `.env`
- Verify token is valid
- Wait 1 minute between requests (rate limit)

### "Voice transcription not working"
- Set `HF_TOKEN` in `.env`
- Send shorter audio (< 30 seconds)
- Check audio quality

## 📱 Running on Different Devices

### Windows
```bash
npm start
```

### macOS / Linux
```bash
npm start
```

### Keep Running in Background

**Windows (PowerShell):**
```powershell
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start"
```

**Linux/macOS:**
```bash
nohup npm start &
```

**Using PM2 (recommended):**
```bash
npm install -g pm2
pm2 start index.js --name "maxvy-bot"
pm2 startup
pm2 save
```

## 🔐 Security Tips

1. **Never share your `.env` file** - It contains API keys
2. **Keep `.env` in `.gitignore`** - Don't commit it
3. **Rotate API keys regularly** - If you suspect compromise
4. **Use strong passwords** - For your WhatsApp account
5. **Keep Node.js updated** - For security patches

## 📚 Next Steps

1. Read the [README.md](README.md) for command documentation
2. Customize handlers in `handlers/` directory
3. Add your own features!
4. Join the community for support

## 💡 Tips

- Use `/help` anytime to see all commands
- Reminders work even when bot is offline (queued)
- Voice notes are auto-transcribed
- Knowledge base (RAG) can store unlimited documents
- Rate limiting prevents API quota exhaustion

## 🆘 Need Help?

1. Check [README.md](README.md) troubleshooting section
2. Review error messages in console
3. Check `.env` configuration
4. Verify API keys are valid
5. Try restarting the bot

---

**Happy botting! 🤖**
