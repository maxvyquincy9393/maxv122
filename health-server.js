// === HEALTH CHECK SERVER ===
// Simple HTTP server for Render health checks and keep-alive

const http = require('http');

const PORT = process.env.PORT || 3000;

// Store QR code globally
let latestQRCode = null;
let qrTimestamp = null;

// Function to set QR code
const setQRCode = (qr) => {
  if (!qr) {
    console.log('⚠️ Warning: Attempted to set empty QR code');
    return;
  }
  latestQRCode = qr;
  qrTimestamp = new Date();
  console.log('✅ QR Code saved! Access at: /qr');
  console.log(`📊 QR Code length: ${qr.length} characters`);
  console.log(`🌐 Access URL: http://localhost:${PORT}/qr`);
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
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 10px;
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
              padding: 30px 20px;
              border-radius: 20px;
              max-width: 600px;
              width: 100%;
              margin: 0 auto;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            h1 { 
              color: #667eea; 
              margin-bottom: 20px;
              font-size: clamp(20px, 5vw, 28px);
            }
            p { 
              font-size: clamp(14px, 3vw, 18px);
              line-height: 1.6;
              margin: 10px 0;
            }
            .refresh { 
              margin-top: 30px;
              padding: 15px 30px;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 10px;
              font-size: clamp(14px, 3vw, 16px);
              cursor: pointer;
              transition: background 0.3s;
            }
            .refresh:hover { background: #5568d3; }
            @media (max-width: 600px) {
              .container {
                padding: 20px 15px;
              }
            }
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
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 10px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow-x: hidden;
            }
            .container {
              background: white;
              color: #333;
              padding: 20px;
              border-radius: 20px;
              max-width: 600px;
              width: 100%;
              margin: 0 auto;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            h1 { 
              color: #667eea; 
              margin-bottom: 10px;
              font-size: clamp(20px, 5vw, 32px);
            }
            .subtitle {
              color: #666;
              margin-bottom: 20px;
              font-size: clamp(14px, 3vw, 16px);
            }
            #qrcode {
              background: white;
              padding: 15px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 20px auto;
              max-width: 100%;
              overflow: hidden;
            }
            #qrcode canvas {
              max-width: 100% !important;
              height: auto !important;
              display: block;
            }
            .link-box {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 10px;
              margin: 15px 0;
              word-break: break-all;
              font-size: clamp(12px, 2.5vw, 14px);
            }
            .link-box a {
              color: #667eea;
              text-decoration: none;
              font-weight: bold;
            }
            .instructions {
              text-align: left;
              background: #f9f9f9;
              padding: 15px;
              border-radius: 10px;
              margin: 15px 0;
              font-size: clamp(13px, 2.5vw, 15px);
            }
            .instructions h3 {
              margin-bottom: 10px;
              font-size: clamp(16px, 3vw, 18px);
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
              line-height: 1.6;
            }
            .timer {
              color: #999;
              font-size: clamp(12px, 2.5vw, 14px);
              margin-top: 15px;
            }
            .warning {
              background: #fff3cd;
              color: #856404;
              padding: 12px;
              border-radius: 10px;
              margin: 15px 0;
              border-left: 4px solid #ffc107;
              font-size: clamp(13px, 2.5vw, 15px);
            }
            @media (max-width: 600px) {
              .container {
                padding: 15px;
                border-radius: 15px;
              }
              #qrcode {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📱 MAXVY WhatsApp Bot</h1>
            <p class="subtitle">Scan QR Code to Connect</p>
            
            <div id="qrcode">
              <p style="color: #999;">⏳ Loading QR code...</p>
            </div>
            
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
              <p><strong>QR Code Data:</strong></p>
              <p style="font-size: 12px; color: #666; word-break: break-all; font-family: monospace;">
                ${latestQRCode.substring(0, 50)}...
              </p>
              <p style="font-size: 14px; margin-top: 10px;">
                <strong>Note:</strong> Scan the QR code above with WhatsApp
              </p>
            </div>
            
            <div class="timer">
              QR Code generated ${qrAge} seconds ago
            </div>
          </div>
          
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <script>
            // QR code data
            const qrData = ${JSON.stringify(latestQRCode)};
            
            console.log('QR Data length:', qrData.length);
            console.log('QR Data preview:', qrData.substring(0, 50));
            
            // Wait for DOM and QRCode library to load
            function generateQR() {
              const qrcodeDiv = document.getElementById('qrcode');
              
              if (!qrData || qrData === 'null' || qrData === 'undefined') {
                qrcodeDiv.innerHTML = '<p style="color: red;">❌ Invalid QR code data</p>';
                return;
              }
              
              if (typeof QRCode === 'undefined') {
                qrcodeDiv.innerHTML = '<p style="color: red;">❌ QR library failed to load. Please refresh.</p>';
                console.error('QRCode library not loaded');
                return;
              }
              
              try {
                // Clear loading message
                qrcodeDiv.innerHTML = '';
                
                // Calculate responsive QR size
                const containerWidth = document.querySelector('.container').offsetWidth;
                const qrSize = Math.min(280, containerWidth - 80);
                
                // Generate QR code
                new QRCode(qrcodeDiv, {
                  text: qrData,
                  width: qrSize,
                  height: qrSize,
                  colorDark: '#000000',
                  colorLight: '#ffffff',
                  correctLevel: QRCode.CorrectLevel.L
                });
                
                console.log('✅ QR code generated successfully');
                console.log('QR size:', qrSize + 'px');
              } catch (error) {
                console.error('QR Generation Error:', error);
                qrcodeDiv.innerHTML = '<p style="color: red;">❌ Error: ' + error.message + '</p>';
              }
            }
            
            // Generate QR when page loads
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', generateQR);
            } else {
              generateQR();
            }
            
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
