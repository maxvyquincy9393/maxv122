# ⚡ SUPABASE QUICK START (5 Minutes)

## 🎯 Setup Checklist

### Step 1: Create Supabase Project (2 min)
1. Go to: **https://app.supabase.com**
2. Click **"New Project"**
3. Fill in:
   - Name: `maxvy-bot-db`
   - Database Password: (save this!)
   - Region: `Singapore` (or closest to you)
4. Click **"Create new project"**
5. Wait ~2 minutes for setup

### Step 2: Run SQL Schema (1 min)
1. In Supabase Dashboard, go to: **SQL Editor**
2. Click **"New Query"**
3. Open file: `supabase-schema.sql`
4. Copy ALL content
5. Paste into SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. ✅ Should see: "Success. No rows returned"

### Step 3: Create Storage Bucket (1 min)
1. Go to: **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Name: `bot-media`
4. Public bucket: **Yes** ✓
5. Click **"Create bucket"**

### Step 4: Get API Keys (1 min)
1. Go to: **Project Settings** (gear icon)
2. Click **"API"** tab
3. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_KEY`

### Step 5: Update .env File
Add to your `.env`:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

### Step 6: Install Supabase Package
```bash
npm install @supabase/supabase-js
```

### Step 7: Test Connection
```bash
npm start
```

Look for: `✅ Supabase connected successfully`

---

## ✅ Verification

Test Supabase is working:

1. **Check Tables:**
   - Go to: **Table Editor**
   - Should see: sessions, messages, user_preferences, reminders, knowledge, memory, analytics

2. **Test Bot:**
   - Send message to bot
   - Check **messages** table
   - Should see new row

3. **Check Storage:**
   - Go to: **Storage → bot-media**
   - Should be empty (will fill when bot sends media)

---

## 🚀 Deploy Options

### Option A: Supabase + Railway (Recommended)
```
✓ Database: Supabase (free)
✓ Bot Runtime: Railway (free)
✓ Total Cost: $0/month
```

**Deploy to Railway:**
1. Go to: https://railway.app
2. New Project → Deploy from GitHub
3. Select: maxvyquincy9393/maxv122
4. Add env vars (including Supabase keys)
5. Deploy!

### Option B: Supabase + Render
```
✓ Database: Supabase (free)
✓ Bot Runtime: Render (free)
✓ Total Cost: $0/month
```

**Deploy to Render:**
1. Follow: `RENDER-SETUP-GUIDE.md`
2. Add Supabase env vars
3. Deploy!

---

## 📊 What You Get

### With Supabase:
- ✅ **Persistent storage** (data survives restarts)
- ✅ **Message history** (context across sessions)
- ✅ **User preferences** (activation status saved)
- ✅ **Reminders** (stored in database)
- ✅ **Knowledge base** (remember/forget commands)
- ✅ **Analytics** (usage tracking)
- ✅ **File storage** (media files)
- ✅ **Backup** (auto-backup by Supabase)

### Without Supabase:
- ⚠️ Local file storage (data lost on restart)
- ⚠️ No message history
- ⚠️ No analytics
- ⚠️ Limited scalability

---

## 🔧 Troubleshooting

### "Supabase not configured"
- Check `.env` has SUPABASE_URL and SUPABASE_ANON_KEY
- Restart bot after adding env vars

### "Connection failed"
- Verify API keys are correct
- Check project URL format: `https://xxxxx.supabase.co`
- Ensure project is not paused (free tier pauses after 7 days inactivity)

### "Table does not exist"
- Run `supabase-schema.sql` in SQL Editor
- Check Table Editor to verify tables exist

### "Storage bucket not found"
- Create `bot-media` bucket in Storage
- Make it public

---

## 💡 Pro Tips

1. **Free Tier Limits:**
   - 500MB database
   - 1GB file storage
   - 2GB bandwidth/month
   - Pauses after 7 days inactivity (just wake it up)

2. **Keep Project Active:**
   - Use bot regularly
   - Or setup cron job to ping database

3. **Monitor Usage:**
   - Dashboard → Project Settings → Usage
   - Track database size, bandwidth

4. **Backup:**
   - Supabase auto-backups daily
   - Download backups: Settings → Database → Backups

---

## 📚 Next Steps

- [ ] Setup complete
- [ ] Bot connected to Supabase
- [ ] Deploy to Railway/Render
- [ ] Setup keep-alive (UptimeRobot)
- [ ] Test all features
- [ ] Monitor usage

---

**Need help?** Check `SUPABASE-DEPLOY-GUIDE.md` for detailed info!

**Ready to deploy?** Follow Railway or Render guide!
