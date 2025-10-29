// === ANALYTICS SERVICE ===
// Track usage statistics and performance

const stats = {
  totalRequests: 0,
  totalUsers: new Set(),
  commands: {},
  providers: {
    groq: { success: 0, failed: 0, totalTime: 0 },
    gemini: { success: 0, failed: 0, totalTime: 0 },
    hf: { success: 0, failed: 0, totalTime: 0 },
  },
  features: {
    ai_chat: 0,
    image_gen: 0,
    tts: 0,
    voice_transcribe: 0,
    sticker: 0,
    meme: 0,
    reminder: 0,
    vision: 0,
  },
  errors: [],
  startTime: Date.now(),
};

/**
 * Track request
 */
function trackRequest(userId, command, provider = null) {
  stats.totalRequests++;
  stats.totalUsers.add(userId);
  
  if (!stats.commands[command]) {
    stats.commands[command] = 0;
  }
  stats.commands[command]++;
  
  // Track feature usage
  if (command.startsWith('ai') || command === 'chat') {
    stats.features.ai_chat++;
  } else if (command.includes('img') || command.includes('image')) {
    stats.features.image_gen++;
  } else if (command === 'tts') {
    stats.features.tts++;
  } else if (command === 'sticker') {
    stats.features.sticker++;
  } else if (command === 'meme') {
    stats.features.meme++;
  } else if (command.includes('reminder')) {
    stats.features.reminder++;
  }
}

/**
 * Track provider performance
 */
function trackProvider(provider, success, responseTime) {
  if (!stats.providers[provider]) {
    stats.providers[provider] = { success: 0, failed: 0, totalTime: 0 };
  }
  
  if (success) {
    stats.providers[provider].success++;
    stats.providers[provider].totalTime += responseTime;
  } else {
    stats.providers[provider].failed++;
  }
}

/**
 * Track error
 */
function trackError(error, context = {}) {
  stats.errors.push({
    message: error.message,
    context,
    timestamp: Date.now(),
  });
  
  // Keep only last 100 errors
  if (stats.errors.length > 100) {
    stats.errors.shift();
  }
}

/**
 * Get statistics report
 */
function getStats() {
  const uptime = Date.now() - stats.startTime;
  const uptimeHours = (uptime / 3600000).toFixed(2);
  
  const providerStats = {};
  for (const [provider, data] of Object.entries(stats.providers)) {
    const total = data.success + data.failed;
    const avgTime = total > 0 ? (data.totalTime / data.success).toFixed(0) : 0;
    const successRate = total > 0 ? ((data.success / total) * 100).toFixed(1) : 0;
    
    providerStats[provider] = {
      success: data.success,
      failed: data.failed,
      successRate: `${successRate}%`,
      avgResponseTime: `${avgTime}ms`,
    };
  }
  
  return {
    uptime: `${uptimeHours} hours`,
    totalRequests: stats.totalRequests,
    totalUsers: stats.totalUsers.size,
    requestsPerHour: (stats.totalRequests / (uptime / 3600000)).toFixed(1),
    topCommands: getTopCommands(5),
    providers: providerStats,
    features: stats.features,
    recentErrors: stats.errors.slice(-10),
  };
}

/**
 * Get top commands
 */
function getTopCommands(limit = 10) {
  return Object.entries(stats.commands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cmd, count]) => ({ command: cmd, count }));
}

/**
 * Format stats for display
 */
function formatStats() {
  const data = getStats();
  
  let report = `📊 *Max Bot Analytics*\n\n`;
  report += `⏱️ Uptime: ${data.uptime}\n`;
  report += `📨 Total Requests: ${data.totalRequests}\n`;
  report += `👥 Total Users: ${data.totalUsers}\n`;
  report += `⚡ Requests/Hour: ${data.requestsPerHour}\n\n`;
  
  report += `🎯 *Top Commands:*\n`;
  data.topCommands.forEach((cmd, i) => {
    report += `${i + 1}. ${cmd.command}: ${cmd.count}x\n`;
  });
  
  report += `\n🤖 *AI Providers:*\n`;
  for (const [provider, stats] of Object.entries(data.providers)) {
    report += `${provider}: ${stats.successRate} success, ${stats.avgResponseTime} avg\n`;
  }
  
  report += `\n✨ *Features Usage:*\n`;
  for (const [feature, count] of Object.entries(data.features)) {
    if (count > 0) {
      report += `${feature}: ${count}x\n`;
    }
  }
  
  return report;
}

/**
 * Reset statistics
 */
function resetStats() {
  stats.totalRequests = 0;
  stats.totalUsers = new Set();
  stats.commands = {};
  stats.errors = [];
  stats.startTime = Date.now();
  
  for (const provider in stats.providers) {
    stats.providers[provider] = { success: 0, failed: 0, totalTime: 0 };
  }
  
  for (const feature in stats.features) {
    stats.features[feature] = 0;
  }
}

module.exports = {
  trackRequest,
  trackProvider,
  trackError,
  getStats,
  formatStats,
  resetStats,
};
