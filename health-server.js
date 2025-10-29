// === HEALTH CHECK SERVER ===
// Simple HTTP server for Render health checks and keep-alive

const http = require('http');

const PORT = process.env.PORT || 3000;

// Store QR code globally
let latestQRCode = null;
let qrTimestamp = null;

// Function to set QR code
const setQRCode = (qr) => {
  latestQRCode = qr;
  qrTimestamp = new Date();
  console.log('✅ QR Code saved! Access at: /qr');
};

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
      },
      qrAvailable: !!latestQRCode
    }));
  } else if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
  } else if (req.url === '/qr') {
    if (!latestQRCode) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MAXVY Bot - QR Code</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              max-width: 600px;
              margin: 0 auto;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            h1 { color: #667eea; margin-bottom: 20px; }
            p { font-size: 18px; line-height: 1.6; }
            .refresh { 
              margin-top: 30px;
              padding: 15px 30px;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 10px;
              font-size: 16px;
              cursor: pointer;
            }
            .refresh:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏳ Waiting for QR Code...</h1>
            <p>Bot is starting up. QR code will appear here automatically.</p>
            <p>This page will refresh every 3 seconds.</p>
            <button class="refresh" onclick="location.reload()">🔄 Refresh Now</button>
          </div>
          <script>
            setTimeout(() => location.reload(), 3000);
          </script>
        </body>
        </html>
      `);
    } else {
      const qrAge = Math.floor((new Date() - qrTimestamp) / 1000);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MAXVY Bot - Scan QR Code</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              max-width: 800px;
              margin: 0 auto;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            h1 { 
              color: #667eea; 
              margin-bottom: 10px;
              font-size: 32px;
            }
            .subtitle {
              color: #666;
              margin-bottom: 30px;
              font-size: 16px;
            }
            #qrcode {
              background: white;
              padding: 20px;
              border-radius: 10px;
              display: inline-block;
              margin: 20px 0;
            }
            .link-box {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              word-break: break-all;
            }
            .link-box a {
              color: #667eea;
              text-decoration: none;
              font-weight: bold;
            }
            .instructions {
              text-align: left;
              background: #f9f9f9;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 10px 0;
              line-height: 1.6;
            }
            .timer {
              color: #999;
              font-size: 14px;
              margin-top: 20px;
            }
            .warning {
              background: #fff3cd;
              color: #856404;
              padding: 15px;
              border-radius: 10px;
              margin: 20px 0;
              border-left: 4px solid #ffc107;
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        </head>
        <body>
          <div class="container">
            <h1>📱 MAXVY WhatsApp Bot</h1>
            <p class="subtitle">Scan QR Code to Connect</p>
            
            <div id="qrcode"></div>
            
            <div class="warning">
              ⚠️ QR Code expires after a few minutes. If it doesn't work, refresh this page.
            </div>
            
            <div class="instructions">
              <h3>📋 How to Connect:</h3>
              <ol>
                <li>Open <strong>WhatsApp</strong> on your phone</li>
                <li>Tap <strong>Menu (⋮)</strong> → <strong>Linked Devices</strong></li>
                <li>Tap <strong>"Link a Device"</strong></li>
                <li><strong>Scan</strong> the QR code above</li>
                <li>Done! Start chatting with <strong>.hi</strong></li>
              </ol>
            </div>
            
            <div class="link-box">
              <p><strong>Or use this link:</strong></p>
              <a href="https://wa.me/qr/${latestQRCode}" target="_blank">
                Click here to open WhatsApp
              </a>
            </div>
            
            <div class="timer">
              QR Code generated ${qrAge} seconds ago
            </div>
          </div>
          
          <script>
            // Generate QR code
            const qrData = '${latestQRCode}';
            QRCode.toCanvas(document.createElement('canvas'), qrData, {
              width: 300,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#ffffff'
              }
            }, function (error, canvas) {
              if (error) {
                console.error(error);
                document.getElementById('qrcode').innerHTML = '<p>Error generating QR code</p>';
              } else {
                document.getElementById('qrcode').appendChild(canvas);
              }
            });
            
            // Auto refresh after 2 minutes
            setTimeout(() => {
              location.reload();
            }, 120000);
          </script>
        </body>
        </html>
      `);
    }
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

module.exports = { server, setQRCode };
