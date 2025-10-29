-- ====================================
-- MAXVY Bot - Supabase Database Schema
-- ====================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 1. SESSIONS TABLE
-- ====================================
-- Stores WhatsApp session data
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  session_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ====================================
-- 2. MESSAGES TABLE
-- ====================================
-- Stores message history for context
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT,
  role TEXT DEFAULT 'user',
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- ====================================
-- 3. USER PREFERENCES TABLE
-- ====================================
-- Stores user settings and activation status
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_active ON user_preferences(is_active);

-- ====================================
-- 4. REMINDERS TABLE
-- ====================================
-- Stores scheduled reminders
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  message TEXT,
  remind_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP
);

-- Indexes for reminder queries
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at) WHERE completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed);

-- ====================================
-- 5. KNOWLEDGE BASE TABLE
-- ====================================
-- Stores user-specific knowledge (remember/forget)
CREATE TABLE IF NOT EXISTS knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON knowledge(user_id);

-- ====================================
-- 6. MEMORY/CONTEXT TABLE
-- ====================================
-- Stores temporary conversation context
CREATE TABLE IF NOT EXISTS memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  memory_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Indexes for memory queries
CREATE INDEX IF NOT EXISTS idx_memory_user_chat ON memory(user_id, chat_id);
CREATE INDEX IF NOT EXISTS idx_memory_expires_at ON memory(expires_at);

-- ====================================
-- 7. ANALYTICS TABLE
-- ====================================
-- Stores usage analytics and events
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id TEXT,
  chat_id TEXT,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);

-- ====================================
-- FUNCTIONS & TRIGGERS
-- ====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for sessions table
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_preferences table
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for knowledge table
DROP TRIGGER IF EXISTS update_knowledge_updated_at ON knowledge;
CREATE TRIGGER update_knowledge_updated_at
    BEFORE UPDATE ON knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- STORAGE BUCKETS
-- ====================================
-- Note: Create these in Supabase Dashboard → Storage

-- 1. bot-media (for images, audio, video)
--    - Make it PUBLIC for easy access
--    - Set file size limits as needed

-- 2. bot-sessions (for session backups)
--    - Keep PRIVATE for security
--    - Only bot can access

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================
-- Optional: Enable RLS for better security

-- Enable RLS on tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create policies (allow service role full access)
-- For service role (bot backend)
CREATE POLICY "Service role has full access to sessions"
  ON sessions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to messages"
  ON messages FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to user_preferences"
  ON user_preferences FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to reminders"
  ON reminders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to knowledge"
  ON knowledge FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to memory"
  ON memory FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to analytics"
  ON analytics FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- CLEANUP FUNCTIONS
-- ====================================

-- Function to clean up old messages (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired memories
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS void AS $$
BEGIN
  DELETE FROM memory
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old analytics (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- SCHEDULED CLEANUP (Optional)
-- ====================================
-- Note: Set up in Supabase Dashboard → Database → Cron Jobs
-- Or use pg_cron extension

-- Example cron job (run daily at 2 AM):
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', $$
--   SELECT cleanup_old_messages();
--   SELECT cleanup_expired_memories();
--   SELECT cleanup_old_analytics();
-- $$);

-- ====================================
-- VIEWS (Optional - for analytics)
-- ====================================

-- View: Daily message count
CREATE OR REPLACE VIEW daily_message_count AS
SELECT
  DATE(timestamp) as date,
  COUNT(*) as message_count,
  COUNT(DISTINCT user_id) as unique_users
FROM messages
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- View: Active users (last 7 days)
CREATE OR REPLACE VIEW active_users_7d AS
SELECT DISTINCT user_id
FROM messages
WHERE timestamp > NOW() - INTERVAL '7 days';

-- View: Popular commands
CREATE OR REPLACE VIEW popular_commands AS
SELECT
  data->>'command' as command,
  COUNT(*) as usage_count
FROM analytics
WHERE event_type = 'command_used'
GROUP BY data->>'command'
ORDER BY usage_count DESC;

-- ====================================
-- INITIAL DATA (Optional)
-- ====================================

-- Insert default system preferences if needed
-- INSERT INTO user_preferences (user_id, is_active, preferences)
-- VALUES ('system', true, '{"version": "3.1", "initialized": true}')
-- ON CONFLICT (user_id) DO NOTHING;

-- ====================================
-- VERIFICATION QUERIES
-- ====================================
-- Run these to verify setup

-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check all indexes
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check storage buckets (run in Supabase Dashboard)
-- SELECT * FROM storage.buckets;

-- ====================================
-- DONE! 🎉
-- ====================================
-- Your database is ready for MAXVY Bot!
--
-- Next steps:
-- 1. Create storage buckets in Dashboard → Storage
-- 2. Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env
-- 3. Install @supabase/supabase-js: npm install @supabase/supabase-js
-- 4. Test connection with your bot
--
-- Need help? Check SUPABASE-DEPLOY-GUIDE.md
