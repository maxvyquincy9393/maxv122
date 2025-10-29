# ⚡ QUICK DEPLOY REFERENCE

## 🚀 Deploy URL
👉 **https://dashboard.render.com/web/new**

---

## ⚙️ Configuration Cheat Sheet

### Basic Settings
```
Name:           maxvy-whatsapp-bot
Region:         Singapore
Branch:         main
Runtime:        Docker
Instance Type:  Free
```

### Required Environment Variables
```
GEMINI_API_KEY              = [your_key]
NODE_ENV                    = production
PORT                        = 3000
GEMINI_MODEL                = gemini-2.0-flash
BOT_PREFIXES                = .,!,/
ACTIVATION_COMMAND          = maxactivate
DEACTIVATION_COMMAND        = maxdeactivate
LOG_LEVEL                   = info
```

### Optional (Enhanced Features)
```
GROQ_API_KEY                = [your_key]
OPENROUTER_API_KEY          = [your_key]
HF_TOKEN                    = [your_key]
WEATHER_API_KEY             = [your_key]
NEWS_API_KEY                = [your_key]
```

### Advanced Settings
```
Health Check Path:  /health
Auto-Deploy:        Yes
```

---

## 📋 Deployment Steps (5 Minutes)

1. **Open:** https://dashboard.render.com/web/new
2. **Connect:** maxvyquincy9393/maxv122 (GitHub)
3. **Configure:** Copy settings above
4. **Add Env Vars:** Paste environment variables
5. **Deploy:** Click "Create Web Service"
6. **Wait:** ~5-10 minutes for build
7. **Scan QR:** Check logs for WhatsApp QR code
8. **Setup Keep-Alive:** UptimeRobot.com

---

## 🔄 Keep-Alive Setup (2 Minutes)

### UptimeRobot (Recommended)
```
URL:        https://uptimerobot.com
Monitor:    HTTP(s)
URL:        https://maxvy-whatsapp-bot.onrender.com/health
Interval:   5 minutes
```

---

## 🔗 Quick Links

- **Deploy:** https://dashboard.render.com/web/new
- **GitHub:** https://github.com/maxvyquincy9393/maxv122
- **Gemini API:** https://makersuite.google.com/app/apikey
- **Groq API:** https://console.groq.com/keys
- **HuggingFace:** https://huggingface.co/settings/tokens
- **UptimeRobot:** https://uptimerobot.com

---

## ✅ Verification Commands

```bash
# Check health
curl https://maxvy-whatsapp-bot.onrender.com/health

# Test ping
curl https://maxvy-whatsapp-bot.onrender.com/ping
```

---

## 🎯 Test Messages (WhatsApp)

```
.hi                     → Basic response
.help                   → Show all commands
.imagine a cute cat     → Generate image
.weather Jakarta        → Get weather
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build failed | Check Dockerfile & dependencies |
| No QR code | Wait 2-3 min, refresh logs |
| Bot not responding | Verify GEMINI_API_KEY |
| Service sleeping | Setup UptimeRobot |
| Out of memory | Upgrade plan or optimize |

---

## 📊 Post-Deploy Checklist

- [ ] Service status: Live (green)
- [ ] Health check: Returns OK
- [ ] QR code: Scanned
- [ ] Bot: Responds to .hi
- [ ] Keep-alive: Active
- [ ] Auto-deploy: Enabled

---

**Ready to deploy? Go to:** https://dashboard.render.com/web/new

**Full guide:** See `RENDER-SETUP-GUIDE.md`
