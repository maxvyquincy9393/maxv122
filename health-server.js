// === HEALTH CHECK SERVER ===
// Simple HTTP server for Render health checks and keep-alive

const http = require('http');

const PORT = process.env.PORT || 3000;

// Health check endpoint
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'MAXVY WhatsApp Bot',
      version: '3.1.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      }
    }));
  } else if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🏥 Health check server running on port ${PORT}`);
  console.log(`📍 Health endpoint: http://localhost:${PORT}/health`);
});

// Keep server alive
setInterval(() => {
  console.log(`💓 Heartbeat - Uptime: ${Math.floor(process.uptime())}s`);
}, 60000); // Every 1 minute

module.exports = server;
