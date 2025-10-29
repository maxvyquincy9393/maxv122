/**
 * Supabase Service
 * Handles all database operations using Supabase PostgreSQL
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    this.supabase = null;
    this.isEnabled = false;
    this.init();
  }

  /**
   * Initialize Supabase client
   */
  init() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.log('⚠️ Supabase not configured. Using local file storage.');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.isEnabled = true;
      console.log('✅ Supabase connected successfully');
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error.message);
      this.isEnabled = false;
    }
  }

  /**
   * Check if Supabase is enabled
   */
  isConnected() {
    return this.isEnabled && this.supabase !== null;
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Save WhatsApp session data
   */
  async saveSession(userId, sessionData) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('sessions')
        .upsert({
          user_id: userId,
          session_data: sessionData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving session:', error.message);
      throw error;
    }
  }

  /**
   * Load WhatsApp session data
   */
  async loadSession(userId) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('sessions')
        .select('session_data')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.session_data || null;
    } catch (error) {
      console.error('Error loading session:', error.message);
      return null;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(userId) {
    if (!this.isConnected()) return null;

    try {
      const { error } = await this.supabase
        .from('sessions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting session:', error.message);
      return false;
    }
  }

  // ==================== MESSAGE HISTORY ====================

  /**
   * Save message to history
   */
  async saveMessage(chatId, userId, message, role = 'user', metadata = {}) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: userId,
          message: message,
          role: role,
          metadata: metadata,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error.message);
      return null;
    }
  }

  /**
   * Get message history for a chat
   */
  async getMessageHistory(chatId, limit = 10) {
    if (!this.isConnected()) return [];

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting message history:', error.message);
      return [];
    }
  }

  /**
   * Clear old messages (cleanup)
   */
  async clearOldMessages(daysOld = 30) {
    if (!this.isConnected()) return null;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await this.supabase
        .from('messages')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing old messages:', error.message);
      return false;
    }
  }

  // ==================== USER PREFERENCES ====================

  /**
   * Save user preferences
   */
  async saveUserPreferences(userId, preferences) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preferences: preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving user preferences:', error.message);
      return null;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('preferences, is_active')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting user preferences:', error.message);
      return null;
    }
  }

  /**
   * Set user active status
   */
  async setUserActive(userId, isActive) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          is_active: isActive,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting user active status:', error.message);
      return null;
    }
  }

  // ==================== REMINDERS ====================

  /**
   * Save reminder
   */
  async saveReminder(userId, chatId, message, remindAt) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('reminders')
        .insert({
          user_id: userId,
          chat_id: chatId,
          message: message,
          remind_at: remindAt,
          completed: false
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving reminder:', error.message);
      return null;
    }
  }

  /**
   * Get pending reminders
   */
  async getPendingReminders() {
    if (!this.isConnected()) return [];

    try {
      const { data, error } = await this.supabase
        .from('reminders')
        .select('*')
        .eq('completed', false)
        .lte('remind_at', new Date().toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending reminders:', error.message);
      return [];
    }
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(reminderId) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('reminders')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing reminder:', error.message);
      return null;
    }
  }

  /**
   * Get user reminders
   */
  async getUserReminders(userId, includeCompleted = false) {
    if (!this.isConnected()) return [];

    try {
      let query = this.supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId);

      if (!includeCompleted) {
        query = query.eq('completed', false);
      }

      const { data, error } = await query.order('remind_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user reminders:', error.message);
      return [];
    }
  }

  // ==================== KNOWLEDGE BASE ====================

  /**
   * Save knowledge
   */
  async saveKnowledge(userId, key, value) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('knowledge')
        .upsert({
          user_id: userId,
          key: key,
          value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,key'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving knowledge:', error.message);
      return null;
    }
  }

  /**
   * Get knowledge
   */
  async getKnowledge(userId, key) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('knowledge')
        .select('value')
        .eq('user_id', userId)
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.value || null;
    } catch (error) {
      console.error('Error getting knowledge:', error.message);
      return null;
    }
  }

  /**
   * Get all knowledge for user
   */
  async getAllKnowledge(userId) {
    if (!this.isConnected()) return {};

    try {
      const { data, error } = await this.supabase
        .from('knowledge')
        .select('key, value')
        .eq('user_id', userId);

      if (error) throw error;

      // Convert to object
      const knowledge = {};
      data.forEach(item => {
        knowledge[item.key] = item.value;
      });

      return knowledge;
    } catch (error) {
      console.error('Error getting all knowledge:', error.message);
      return {};
    }
  }

  /**
   * Delete knowledge
   */
  async deleteKnowledge(userId, key) {
    if (!this.isConnected()) return null;

    try {
      const { error } = await this.supabase
        .from('knowledge')
        .delete()
        .eq('user_id', userId)
        .eq('key', key);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting knowledge:', error.message);
      return false;
    }
  }

  // ==================== MEMORY/CONTEXT ====================

  /**
   * Save conversation memory
   */
  async saveMemory(userId, chatId, memoryData, expiresInHours = 24) {
    if (!this.isConnected()) return null;

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const { data, error } = await this.supabase
        .from('memory')
        .insert({
          user_id: userId,
          chat_id: chatId,
          memory_data: memoryData,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving memory:', error.message);
      return null;
    }
  }

  /**
   * Get conversation memory
   */
  async getMemory(userId, chatId) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase
        .from('memory')
        .select('memory_data')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.memory_data || null;
    } catch (error) {
      console.error('Error getting memory:', error.message);
      return null;
    }
  }

  /**
   * Clear expired memories
   */
  async clearExpiredMemories() {
    if (!this.isConnected()) return null;

    try {
      const { error } = await this.supabase
        .from('memory')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing expired memories:', error.message);
      return false;
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Log analytics event
   */
  async logEvent(eventType, userId, chatId, data = {}) {
    if (!this.isConnected()) return null;

    try {
      const { error } = await this.supabase
        .from('analytics')
        .insert({
          event_type: eventType,
          user_id: userId,
          chat_id: chatId,
          data: data,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error logging event:', error.message);
      return false;
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(days = 7) {
    if (!this.isConnected()) return null;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('analytics')
        .select('event_type, count')
        .gte('timestamp', cutoffDate.toISOString());

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting analytics summary:', error.message);
      return null;
    }
  }

  // ==================== STORAGE (FILES) ====================

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(bucket, path, file, contentType) {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: contentType,
          upsert: true
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading file:', error.message);
      return null;
    }
  }

  /**
   * Get public URL for file
   */
  getFileUrl(bucket, path) {
    if (!this.isConnected()) return null;

    try {
      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting file URL:', error.message);
      return null;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket, path) {
    if (!this.isConnected()) return null;

    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new SupabaseService();
