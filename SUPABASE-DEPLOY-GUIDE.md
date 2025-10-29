# 🚀 SUPABASE DEPLOYMENT GUIDE

## Kenapa Supabase?

✅ **Advantages:**
- **Free tier generous:** 500MB database, 1GB file storage, 2GB bandwidth
- **PostgreSQL database:** Built-in database untuk persistent storage
- **Storage:** File storage untuk media/session files
- **Edge Functions:** Serverless functions (alternative untuk bot)
- **Real-time:** WebSocket support
- **Authentication:** Built-in auth system
- **Better than Render:** Lebih stable, tidak sleep, database included

---

## 📋 DEPLOYMENT OPTIONS

### Option 1: Supabase Edge Functions (Recommended)
Deploy bot sebagai Edge Function (Deno runtime)

### Option 2: Supabase + External Hosting
- Database & Storage: Supabase
- Bot Runtime: Railway/Fly.io/Render
- **Best of both worlds!**

### Option 3: Supabase Database Only
- Use Supabase hanya untuk database
- Deploy bot di platform lain

---

## 🎯 OPTION 1: Full Supabase Deployment

### Prerequisites
- Supabase account (gratis)
- Supabase CLI installed
- GitHub repository

### Step 1: Install Supabase CLI

**Windows (PowerShell):**
```powershell
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Initialize Supabase Project

```bash
cd c:\Users\test\OneDrive\Desktop\maxvy12
supabase init
```

### Step 4: Link to Supabase Project

1. Create project di: https://app.supabase.com
2. Copy project reference ID
3. Link project:

```bash
supabase link --project-ref your-project-ref
```

### Step 5: Create Edge Function

```bash
supabase functions new whatsapp-bot
```

### Step 6: Convert Bot to Edge Function

Create `supabase/functions/whatsapp-bot/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import your bot logic here
// Note: You'll need to adapt your Node.js code to Deno

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Your bot logic here
    
    return new Response(
      JSON.stringify({ status: 'ok' }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### Step 7: Deploy Edge Function

```bash
supabase functions deploy whatsapp-bot --no-verify-jwt
```

---

## 🎯 OPTION 2: Supabase + Railway (RECOMMENDED)

This is the **BEST approach** - use Supabase for database/storage, Railway for bot runtime.

### Architecture
```
┌─────────────────┐
│   Supabase      │
│  - Database     │ ←──┐
│  - Storage      │    │
│  - Auth         │    │
└─────────────────┘    │
                       │
                       │
┌─────────────────┐    │
│   Railway       │    │
│  - Bot Runtime  │────┘
│  - WhatsApp     │
│  - AI Logic     │
└─────────────────┘
```

### Setup Steps

#### A. Setup Supabase Database

1. **Create Supabase Project:**
   - Go to: https://app.supabase.com
   - Click "New Project"
   - Name: `maxvy-bot-db`
   - Database Password: (save this!)
   - Region: Singapore

2. **Create Tables:**

```sql
-- Sessions table (untuk WhatsApp session)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  session_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table (untuk history)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  message TEXT,
  remind_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE
);

-- Knowledge base
CREATE TABLE knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, key)
);
```

3. **Get Connection Details:**
   - Go to: Project Settings → Database
   - Copy: `Connection String` (URI mode)
   - Save for later

4. **Setup Storage Bucket:**
   - Go to: Storage
   - Create bucket: `bot-media`
   - Make it public (for media files)

#### B. Update Bot Code for Supabase

1. **Install Supabase Client:**

```bash
npm install @supabase/supabase-js
```

2. **Create Supabase Service:**

Create `services/supabase-service.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseService {
  // Save session
  async saveSession(userId, sessionData) {
    const { data, error } = await supabase
      .from('sessions')
      .upsert({ user_id: userId, session_data: sessionData, updated_at: new Date() });
    
    if (error) throw error;
    return data;
  }

  // Load session
  async loadSession(userId) {
    const { data, error } = await supabase
      .from('sessions')
      .select('session_data')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data?.session_data;
  }

  // Save message
  async saveMessage(chatId, userId, message, metadata = {}) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, user_id: userId, message, metadata });
    
    if (error) throw error;
    return data;
  }

  // Get message history
  async getMessageHistory(chatId, limit = 10) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  // Save reminder
  async saveReminder(userId, chatId, message, remindAt) {
    const { data, error } = await supabase
      .from('reminders')
      .insert({ user_id: userId, chat_id: chatId, message, remind_at: remindAt });
    
    if (error) throw error;
    return data;
  }

  // Get pending reminders
  async getPendingReminders() {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('completed', false)
      .lte('remind_at', new Date().toISOString());
    
    if (error) throw error;
    return data;
  }

  // Upload file to storage
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    return data;
  }

  // Get file URL
  getFileUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}

module.exports = new SupabaseService();
```

#### C. Deploy to Railway

1. **Go to:** https://railway.app
2. **New Project → Deploy from GitHub**
3. **Select:** maxvyquincy9393/maxv122
4. **Add Environment Variables:**

```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Bot Config
GEMINI_API_KEY=your-key
GROQ_API_KEY=your-key
NODE_ENV=production
PORT=3000
```

5. **Deploy!**

---

## 🎯 OPTION 3: Supabase Database + Render

Similar to Railway, but using Render:

1. Setup Supabase (same as Option 2A)
2. Deploy to Render (see RENDER-SETUP-GUIDE.md)
3. Add Supabase env vars to Render

---

## 📊 Database Schema Design

### Complete Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  session_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT,
  role TEXT DEFAULT 'user',
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  message TEXT,
  remind_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP
);

CREATE INDEX idx_reminders_remind_at ON reminders(remind_at) WHERE completed = FALSE;

-- Knowledge base
CREATE TABLE knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Memory/Context
CREATE TABLE memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  memory_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_memory_user_chat ON memory(user_id, chat_id);

-- Analytics
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id TEXT,
  chat_id TEXT,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
```

---

## 🔧 Environment Variables

Add to your `.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here

# Existing config...
GEMINI_API_KEY=your-key
GROQ_API_KEY=your-key
# ... rest of your env vars
```

---

## 📈 Migration Guide

### Migrate from File Storage to Supabase

1. **Backup existing data:**
```bash
cp -r auth_info_baileys auth_info_baileys.backup
cp memory.json memory.json.backup
cp reminders.json reminders.json.backup
```

2. **Update storage.js to use Supabase:**
   - Replace file operations with Supabase queries
   - Use `supabase-service.js` methods

3. **Migrate existing data:**
```javascript
// migration-script.js
const fs = require('fs');
const supabase = require('./services/supabase-service');

async function migrate() {
  // Migrate reminders
  const reminders = JSON.parse(fs.readFileSync('reminders.json'));
  for (const reminder of reminders) {
    await supabase.saveReminder(
      reminder.userId,
      reminder.chatId,
      reminder.message,
      reminder.remindAt
    );
  }
  
  // Migrate memory
  const memory = JSON.parse(fs.readFileSync('memory.json'));
  // ... migrate memory data
  
  console.log('Migration complete!');
}

migrate();
```

---

## 🎯 Recommended Setup (Best Practice)

```
┌──────────────────────────────────────┐
│         SUPABASE (Free Tier)         │
│  ✓ PostgreSQL Database               │
│  ✓ File Storage (media/sessions)     │
│  ✓ Real-time subscriptions           │
│  ✓ Authentication (future)           │
└──────────────────────────────────────┘
                  ↕
┌──────────────────────────────────────┐
│      RAILWAY/RENDER (Free Tier)      │
│  ✓ Bot Runtime (Node.js)             │
│  ✓ WhatsApp Connection               │
│  ✓ AI Processing                     │
│  ✓ Health Check Endpoint             │
└──────────────────────────────────────┘
                  ↕
┌──────────────────────────────────────┐
│         UPTIMEROBOT (Free)           │
│  ✓ Keep-alive pings                  │
│  ✓ Uptime monitoring                 │
└──────────────────────────────────────┘
```

**Total Cost: $0/month** 🎉

---

## ✅ Advantages of This Setup

1. **Persistent Storage:** Data tidak hilang saat restart
2. **Scalable:** Easy to scale database independently
3. **Backup:** Supabase auto-backup database
4. **Analytics:** Query message history, user stats
5. **Real-time:** WebSocket support untuk future features
6. **Free:** Semua free tier, no credit card needed

---

## 🚀 Quick Start (Recommended Path)

1. **Create Supabase project** (5 min)
2. **Run SQL schema** (2 min)
3. **Add Supabase client to bot** (10 min)
4. **Deploy to Railway** (5 min)
5. **Test & verify** (5 min)

**Total: ~30 minutes** ⚡

---

## 📞 Next Steps

1. Want me to help integrate Supabase into your bot code?
2. Need help with Railway deployment?
3. Want to migrate existing data?

Let me know! 🚀
