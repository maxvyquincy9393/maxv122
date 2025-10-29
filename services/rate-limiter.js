// === RATE LIMITER SERVICE ===
// Prevent abuse with smart rate limiting per user

const userLimits = new Map();

// Rate limit configurations
const LIMITS = {
  ai_chat: { max: 20, window: 60000 },      // 20 requests per minute
  image_gen: { max: 5, window: 300000 },    // 5 images per 5 minutes
  tts: { max: 10, window: 60000 },          // 10 TTS per minute
  voice_transcribe: { max: 10, window: 60000 }, // 10 transcriptions per minute
  reminder: { max: 50, window: 86400000 },  // 50 reminders per day
};

/**
 * Check if user has exceeded rate limit
 */
function checkRateLimit(userId, action = 'ai_chat') {
  const limit = LIMITS[action] || LIMITS.ai_chat;
  const now = Date.now();
  
  if (!userLimits.has(userId)) {
    userLimits.set(userId, {});
  }
  
  const userActions = userLimits.get(userId);
  
  if (!userActions[action]) {
    userActions[action] = [];
  }
  
  // Remove old timestamps outside the window
  userActions[action] = userActions[action].filter(
    timestamp => now - timestamp < limit.window
  );
  
  // Check if limit exceeded
  if (userActions[action].length >= limit.max) {
    const oldestTimestamp = userActions[action][0];
    const timeUntilReset = limit.window - (now - oldestTimestamp);
    const minutesLeft = Math.ceil(timeUntilReset / 60000);
    
    return {
      limited: true,
      message: `⏳ Rate limit tercapai!\n\n` +
               `Limit: ${limit.max} ${action} per ${limit.window / 60000} menit\n` +
               `Coba lagi dalam: ${minutesLeft} menit\n\n` +
               `💡 Tip: Tunggu sebentar ya!`,
      timeUntilReset,
    };
  }
  
  // Add current timestamp
  userActions[action].push(now);
  
  return {
    limited: false,
    remaining: limit.max - userActions[action].length,
  };
}

/**
 * Get user's current usage stats
 */
function getUserStats(userId) {
  if (!userLimits.has(userId)) {
    return null;
  }
  
  const userActions = userLimits.get(userId);
  const stats = {};
  
  Object.keys(LIMITS).forEach(action => {
    if (userActions[action]) {
      const limit = LIMITS[action];
      const now = Date.now();
      const recentActions = userActions[action].filter(
        timestamp => now - timestamp < limit.window
      );
      
      stats[action] = {
        used: recentActions.length,
        limit: limit.max,
        remaining: limit.max - recentActions.length,
      };
    }
  });
  
  return stats;
}

/**
 * Reset user's limits (admin only)
 */
function resetUserLimits(userId) {
  userLimits.delete(userId);
  return true;
}

/**
 * Clean up old data (run periodically)
 */
function cleanup() {
  const now = Date.now();
  const maxWindow = Math.max(...Object.values(LIMITS).map(l => l.window));
  
  for (const [userId, actions] of userLimits.entries()) {
    let hasRecentActivity = false;
    
    for (const action in actions) {
      actions[action] = actions[action].filter(
        timestamp => now - timestamp < maxWindow
      );
      
      if (actions[action].length > 0) {
        hasRecentActivity = true;
      }
    }
    
    if (!hasRecentActivity) {
      userLimits.delete(userId);
    }
  }
}

// Cleanup every hour
setInterval(cleanup, 3600000);

module.exports = {
  checkRateLimit,
  getUserStats,
  resetUserLimits,
  LIMITS,
};
