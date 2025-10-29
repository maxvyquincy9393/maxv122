// === KEEP-ALIVE SERVICE ===
// Pings the health endpoint every 10 minutes to prevent Render from sleeping

const https = require('https');
const http = require('http');

const RENDER_URL = process.env.RENDER_URL || 'http://localhost:3000';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

function pingServer() {
  const url = `${RENDER_URL}/health`;
  const protocol = url.startsWith('https') ? https : http;
  
  console.log(`🏓 Pinging server: ${url}`);
  
  protocol.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Server is alive:', JSON.parse(data));
      } else {
        console.log('⚠️ Server responded with status:', res.statusCode);
      }
    });
  }).on('error', (err) => {
    console.error('❌ Ping failed:', err.message);
  });
}

// Start pinging
console.log('🚀 Keep-alive service started');
console.log(`📍 Target: ${RENDER_URL}`);
console.log(`⏰ Interval: ${PING_INTERVAL / 1000 / 60} minutes`);

// Ping immediately on start
pingServer();

// Then ping every interval
setInterval(pingServer, PING_INTERVAL);

module.exports = { pingServer };
