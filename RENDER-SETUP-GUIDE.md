# 🚀 RENDER DEPLOYMENT - Step by Step Guide

## ✅ Prerequisites Checklist
- [x] Code pushed to GitHub: `https://github.com/maxvyquincy9393/maxv122`
- [ ] Render.com account (sign up gratis)
- [ ] API Keys ready (minimal: Gemini API Key)

---

## 📋 STEP-BY-STEP DEPLOYMENT

### STEP 1: Buka Render Dashboard
1. Go to: **https://dashboard.render.com/web/new**
2. Login dengan GitHub account kamu

### STEP 2: Connect GitHub Repository
1. Di halaman "Create a new Web Service"
2. Klik **"Connect account"** atau **"Configure account"** untuk GitHub
3. Pilih repository: **maxvyquincy9393/maxv122**
4. Klik **"Connect"**

### STEP 3: Configure Web Service

Fill in the following settings:

#### **Basic Information:**
```
Name: maxvy-whatsapp-bot
Region: Singapore (atau pilih terdekat dengan lokasi kamu)
Branch: main
```

#### **Build Settings:**
```
Runtime: Docker
Dockerfile Path: ./Dockerfile (auto-detected)
Docker Command: (leave empty, akan pakai CMD dari Dockerfile)
```

#### **Instance Type:**
```
Instance Type: Free
```

### STEP 4: Environment Variables (PENTING!)

Scroll ke bagian **"Environment Variables"** dan tambahkan:

#### **REQUIRED (Wajib):**
```
GEMINI_API_KEY = your_actual_gemini_api_key_here
```
👉 Get from: https://makersuite.google.com/app/apikey

#### **RECOMMENDED (Untuk fitur lengkap):**
```
GROQ_API_KEY = your_groq_api_key_here
OPENROUTER_API_KEY = your_openrouter_api_key_here
HF_TOKEN = your_huggingface_token_here
```

#### **SYSTEM CONFIG (Auto-filled):**
```
NODE_ENV = production
PORT = 3000
GEMINI_MODEL = gemini-2.0-flash
BOT_PREFIXES = .,!,/
ACTIVATION_COMMAND = maxactivate
DEACTIVATION_COMMAND = maxdeactivate
LOG_LEVEL = info
```

### STEP 5: Advanced Settings

Scroll ke **"Advanced"** section:

```
Health Check Path: /health
Auto-Deploy: Yes (enabled)
```

### STEP 6: Create Web Service

1. Review semua settings
2. Klik **"Create Web Service"** (tombol biru di bawah)
3. Tunggu build process (~5-10 menit)

---

## 📊 MONITORING DEPLOYMENT

### Build Process
Watch the logs di Render dashboard:
- Building Docker image...
- Installing dependencies...
- Starting service...
- ✅ Service is live!

### Get Your Service URL
After deployment success, copy URL:
```
https://maxvy-whatsapp-bot.onrender.com
```

### Check Health Status
Test endpoint:
```
https://maxvy-whatsapp-bot.onrender.com/health
```

---

## 📱 STEP 7: Connect WhatsApp

### View QR Code
1. Di Render dashboard, klik tab **"Logs"**
2. Tunggu sampai muncul QR code ASCII art di logs
3. Scroll untuk lihat full QR code

### Scan QR Code
1. Buka WhatsApp di HP
2. Go to: **Settings → Linked Devices → Link a Device**
3. Scan QR code dari Render logs
4. Wait for connection...
5. ✅ **Bot connected!**

---

## 🔄 STEP 8: Setup Keep-Alive (24/7 Uptime)

### Why Keep-Alive?
Render free tier akan sleep setelah 15 menit tanpa request. Keep-alive service akan ping bot setiap 5-10 menit agar tetap aktif.

### Option 1: UptimeRobot (Recommended - Gratis)

1. **Sign up:** https://uptimerobot.com
2. **Add New Monitor:**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `MAXVY Bot`
   - URL: `https://maxvy-whatsapp-bot.onrender.com/health`
   - Monitoring Interval: `5 minutes`
3. **Save** → Done! Bot akan tetap aktif 24/7

### Option 2: Cron-Job.org (Alternative)

1. **Sign up:** https://cron-job.org
2. **Create Cronjob:**
   - Title: `MAXVY Keep-Alive`
   - URL: `https://maxvy-whatsapp-bot.onrender.com/health`
   - Schedule: `*/10 * * * *` (every 10 minutes)
3. **Enable** → Done!

### Option 3: Better Uptime (Alternative)

1. **Sign up:** https://betteruptime.com
2. **Create Monitor:**
   - URL: `https://maxvy-whatsapp-bot.onrender.com/health`
   - Check frequency: `5 minutes`
3. **Save** → Done!

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify:

- [ ] Service status: **Live** (green indicator)
- [ ] Health check: Returns `{"status":"ok","uptime":...}`
- [ ] Logs: No error messages
- [ ] WhatsApp: QR code scanned successfully
- [ ] Bot: Responds to messages
- [ ] Keep-Alive: UptimeRobot/Cron-Job active

---

## 🎯 TESTING YOUR BOT

Send test messages to WhatsApp:

```
.hi
→ Bot should respond

.help
→ Shows all commands

.imagine a cute cat
→ Generates image (if HF_TOKEN configured)

.weather Jakarta
→ Shows weather (if WEATHER_API_KEY configured)
```

---

## 🔧 TROUBLESHOOTING

### ❌ Build Failed
**Solution:**
- Check Dockerfile syntax
- Verify package.json dependencies
- Check Render logs for error details

### ❌ Service Keeps Crashing
**Solution:**
- Check environment variables (especially GEMINI_API_KEY)
- View logs for error messages
- Verify API keys are valid

### ❌ QR Code Not Showing
**Solution:**
- Wait 2-3 minutes after deployment
- Refresh logs page
- Check if `auth_info_baileys/` folder exists in logs

### ❌ Bot Not Responding
**Solution:**
- Verify WhatsApp connection in logs
- Check if bot is activated (send `maxactivate` in private chat)
- Verify API keys are correct

### ❌ Service Sleeping
**Solution:**
- Setup keep-alive service (UptimeRobot)
- Verify ping interval < 14 minutes
- Check UptimeRobot monitor is active

### ❌ Out of Memory
**Solution:**
- Render free tier: 512MB RAM
- Optimize code or upgrade to paid plan
- Clear old session data

---

## 🔄 AUTO-DEPLOY SETUP

Your bot will auto-deploy on every GitHub push:

1. Make changes locally
2. Commit: `git add . && git commit -m "update"`
3. Push: `git push origin main`
4. Render will auto-build and deploy (~5-10 min)
5. Check logs to verify deployment

---

## 📊 MONITORING & LOGS

### View Logs
```
Render Dashboard → Your Service → Logs
```

### Check Metrics
```
Render Dashboard → Your Service → Metrics
- CPU usage
- Memory usage
- Request count
```

### Health Endpoints
```
/health - Full status
/ping   - Simple ping
```

---

## 💡 TIPS & BEST PRACTICES

### 1. Environment Variables
- Never commit API keys to GitHub
- Use Render's environment variables
- Keep `.env` in `.gitignore`

### 2. Monitoring
- Setup UptimeRobot for 24/7 uptime
- Check logs regularly
- Monitor memory usage

### 3. Updates
- Test locally before pushing
- Use git branches for major changes
- Monitor deployment logs

### 4. Security
- Keep API keys secret
- Rotate keys periodically
- Monitor unusual activity

### 5. Performance
- Use Gemini Flash for faster responses
- Enable rate limiting
- Clear old session data

---

## 📞 SUPPORT

Need help?
- Check logs first
- Review troubleshooting section
- Contact: maxvy.ai

---

## 🎉 SUCCESS!

Your MAXVY WhatsApp Bot is now:
- ✅ Deployed on Render
- ✅ Running 24/7 with keep-alive
- ✅ Auto-deploying on GitHub push
- ✅ Connected to WhatsApp
- ✅ Ready to serve users!

**Enjoy your AI-powered WhatsApp bot! 🚀**

---

## 📚 ADDITIONAL RESOURCES

- **Render Docs:** https://render.com/docs
- **GitHub Repo:** https://github.com/maxvyquincy9393/maxv122
- **Gemini API:** https://makersuite.google.com/app/apikey
- **UptimeRobot:** https://uptimerobot.com

---

**Last Updated:** Oct 30, 2024
**Version:** 3.1
**Platform:** Render.com
