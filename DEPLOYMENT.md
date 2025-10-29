# 🚀 Deployment Guide - Render.com

## Deploy MAXVY Bot ke Render (24/7 Uptime)

### Prerequisites
- Akun Render.com (gratis)
- Repository GitHub sudah di-push
- API Keys siap (Gemini, Groq, dll)

### Step 1: Connect GitHub Repository

1. Login ke [Render.com](https://render.com)
2. Klik **"New +"** → **"Web Service"**
3. Connect GitHub repository: `maxvyquincy9393/maxv122`
4. Pilih branch: `main`

### Step 2: Configure Service

**Basic Settings:**
- **Name:** `maxvy-whatsapp-bot`
- **Region:** Singapore (atau terdekat)
- **Branch:** `main`
- **Runtime:** Docker
- **Instance Type:** Free

**Build Settings:**
- Render akan otomatis detect `Dockerfile`
- Tidak perlu setting build command

### Step 3: Environment Variables

Tambahkan environment variables berikut di Render dashboard:

```
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
HF_TOKEN=your_huggingface_token_here
GEMINI_MODEL=gemini-2.0-flash
NODE_ENV=production
PORT=3000
BOT_PREFIXES=.,!,/
LOG_LEVEL=info
```

### Step 4: Deploy

1. Klik **"Create Web Service"**
2. Tunggu build process selesai (~5-10 menit)
3. Setelah deploy, copy URL Render (contoh: `https://maxvy-whatsapp-bot.onrender.com`)

### Step 5: Setup Keep-Alive (24/7)

#### Option 1: UptimeRobot (Recommended)
1. Daftar di [UptimeRobot.com](https://uptimerobot.com) (gratis)
2. Add New Monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** MAXVY Bot
   - **URL:** `https://your-render-url.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
3. Save → Bot akan di-ping setiap 5 menit

#### Option 2: Cron-Job.org
1. Daftar di [Cron-Job.org](https://cron-job.org)
2. Create New Cronjob:
   - **Title:** MAXVY Keep-Alive
   - **URL:** `https://your-render-url.onrender.com/health`
   - **Schedule:** Every 10 minutes
3. Save

#### Option 3: Self-Hosted Keep-Alive
Deploy `keep-alive.js` di service terpisah atau local:
```bash
RENDER_URL=https://your-render-url.onrender.com node keep-alive.js
```

### Step 6: Scan QR Code WhatsApp

1. Buka Render logs: Dashboard → Service → Logs
2. Tunggu sampai muncul QR code di logs
3. Scan QR code dengan WhatsApp
4. Bot akan connect dan mulai berjalan!

### Important Notes

⚠️ **Render Free Tier Limitations:**
- Service akan sleep setelah 15 menit tidak ada request
- Butuh keep-alive service untuk 24/7 uptime
- 750 jam/bulan gratis (cukup untuk 1 service 24/7)

✅ **Health Check Endpoints:**
- `/health` - Full status check
- `/ping` - Simple ping

🔄 **Auto-Deploy:**
- Setiap push ke GitHub main branch akan auto-deploy
- Build time: ~5-10 menit

📊 **Monitoring:**
- Cek logs di Render dashboard
- Health check: `https://your-url.onrender.com/health`

### Troubleshooting

**Bot tidak connect WhatsApp:**
- Cek logs untuk QR code
- Pastikan tidak ada session lama di `auth_info_baileys/`
- Restart service di Render

**Service sleep terus:**
- Pastikan keep-alive service aktif
- Cek UptimeRobot/Cron-Job running
- Interval ping maksimal 14 menit

**Out of memory:**
- Upgrade ke paid plan
- Atau optimize memory usage

### Support

Butuh bantuan? Contact: maxvy.ai

---

🎉 **Selamat! Bot kamu sekarang running 24/7 di cloud!**
