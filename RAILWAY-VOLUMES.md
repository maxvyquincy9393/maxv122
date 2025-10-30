# Railway Persistent Storage Setup

## Problem
Setiap deploy ulang, bot minta scan QR lagi dan data hilang karena Railway tidak menyimpan file secara persistent by default.

## Solution: Railway Volumes

### 1. Setup Volumes di Railway Dashboard

1. **Buka Railway Dashboard** → Pilih project bot kamu
2. **Klik tab "Settings"**
3. **Scroll ke "Volumes"**
4. **Add Volume:**
   - **Volume Name:** `bot-data`
   - **Mount Path:** `/app/data`
   - Klik **Add**

5. **Add Volume kedua:**
   - **Volume Name:** `auth-session`
   - **Mount Path:** `/app/auth_info_baileys`
   - Klik **Add**

### 2. Redeploy

Setelah volumes ditambahkan:
1. Klik **Deploy** → **Redeploy**
2. Scan QR code **SEKALI TERAKHIR**
3. Setelah ini, session akan tersimpan permanent!

### 3. Verify

Check logs setelah redeploy:
```
📁 Storage directory initialized
✅ Storage initialized successfully
📋 Loaded X user reminder sets
```

Kalau ada "Loaded X user reminder sets", berarti data tersimpan!

## What Gets Saved

### `/app/data` Volume:
- ✅ `reminders.json` - Semua reminder
- ✅ `memory.json` - Conversation memory
- ✅ `knowledge.json` - Knowledge base

### `/app/auth_info_baileys` Volume:
- ✅ WhatsApp session credentials
- ✅ QR code authentication
- ✅ Connection state

## Benefits

✅ **No more QR scanning** setiap deploy
✅ **Reminders persist** across deploys
✅ **Memory preserved** - bot ingat conversation
✅ **Knowledge base saved** - RAG data tetap ada

## Troubleshooting

### Masih Minta QR Setelah Setup?
1. Pastikan mount path **EXACT**: `/app/data` dan `/app/auth_info_baileys`
2. Redeploy setelah add volumes
3. Scan QR sekali lagi

### Data Masih Hilang?
1. Check logs: `📁 Storage directory initialized`
2. Pastikan volumes attached di Settings
3. Restart service

### Session Expired?
Kalau WhatsApp logout session (401 error), tetap perlu scan QR lagi. Ini normal behavior WhatsApp, bukan masalah Railway.

## Alternative: Supabase Storage

Kalau Railway volumes ga work, bisa pakai Supabase:
1. Setup Supabase project
2. Enable storage bucket
3. Update `.env` dengan Supabase credentials
4. Bot akan auto-sync ke cloud

Check `SUPABASE-DEPLOY-GUIDE.md` untuk details!
