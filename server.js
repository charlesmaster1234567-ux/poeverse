const http = require('http');
const fs = require('fs');
const path = require('path');

// Try to load ws, with error handling
let WebSocketServer;
try {
  const ws = require('ws');
  WebSocketServer = ws.WebSocketServer;
  console.log('✅ WebSocket module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load ws module:', error.message);
  console.error('Run: npm install ws');
  process.exit(1);
}

// ===== MIME TYPES =====
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json'
};

// ===== HTTP SERVER =====
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  let filePath = req.url;
  
  // Remove query string
  const queryIndex = filePath.indexOf('?');
  if (queryIndex !== -1) {
    filePath = filePath.substring(0, queryIndex);
  }

  // Default route
  if (filePath === '/') {
    filePath = '/index.html';
  }

  // Build full path
  const fullPath = path.join(__dirname, filePath);

  // Security check
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Get extension
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Read file
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try .html extension
        fs.readFile(fullPath + '.html', (err2, content2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Not Found</h1><p>File: ' + filePath + '</p>');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 - Internal Server Error\n' + err.message);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    }
  });
});

// ===== WEBSOCKET SERVER =====
console.log('Initializing WebSocket server...');

const wss = new WebSocketServer({ 
  server,
  perMessageDeflate: false,
  clientTracking: true
});

const clients = new Map();
let userIdCounter = 0;

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#F7DC6F', '#82E0AA',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#58D68D'
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const getOnlineUsers = () => {
  const users = [];
  clients.forEach(client => {
    users.push({
      id: client.id,
      username: client.username,
      color: client.color
    });
  });
  return users;
};

const broadcast = (data, excludeWs = null) => {
  const message = JSON.stringify(data);
  clients.forEach((clientData, ws) => {
    if (ws !== excludeWs && ws.readyState === 1) {
      try {
        ws.send(message);
      } catch (e) {
        console.error('Broadcast error:', e.message);
      }
    }
  });
};

const broadcastAll = (data) => {
  const message = JSON.stringify(data);
  clients.forEach((clientData, ws) => {
    if (ws.readyState === 1) {
      try {
        ws.send(message);
      } catch (e) {
        console.error('Broadcast error:', e.message);
      }
    }
  });
};

wss.on('connection', (ws, req) => {
  const userId = ++userIdCounter;
  const userColor = getRandomColor();
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  clients.set(ws, {
    id: userId,
    username: `Guest_${userId}`,
    color: userColor
  });

  console.log(`[+] User ${userId} connected from ${clientIP} (Total: ${clients.size})`);

  // Send welcome
  try {
    ws.send(JSON.stringify({
      type: 'welcome',
      id: userId,
      color: userColor
    }));
  } catch (e) {
    console.error('Failed to send welcome:', e.message);
  }

  // Handle messages
  ws.on('message', (rawData) => {
    let data;
    try {
      data = JSON.parse(rawData.toString());
    } catch (e) {
      console.error('[WS] Invalid JSON');
      return;
    }

    const client = clients.get(ws);
    if (!client) return;

    switch (data.type) {
      case 'join':
        client.username = (data.username || '').trim().slice(0, 30) || `Guest_${userId}`;
        console.log(`[JOIN] ${client.username}`);
        
        broadcastAll({
          type: 'user_joined',
          id: client.id,
          username: client.username,
          color: client.color,
          users: getOnlineUsers(),
          timestamp: Date.now()
        });
        break;

      case 'message':
        const text = (data.text || '').trim().slice(0, 500);
        if (!text) return;

        console.log(`[MSG] ${client.username}: ${text.substring(0, 30)}`);

        broadcastAll({
          type: 'message',
          id: client.id,
          username: client.username,
          color: client.color,
          text: text,
          timestamp: Date.now()
        });
        break;

      case 'typing':
        broadcast({
          type: 'typing',
          id: client.id,
          username: client.username,
          isTyping: data.isTyping
        }, ws);
        break;

      default:
        console.log('[WS] Unknown type:', data.type);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      console.log(`[-] ${client.username} left (Total: ${clients.size - 1})`);
      clients.delete(ws);

      broadcastAll({
        type: 'user_left',
        id: client.id,
        username: client.username,
        users: getOnlineUsers(),
        timestamp: Date.now()
      });
    }
  });

  ws.on('error', (error) => {
    console.error('[WS] Client error:', error.message);
  });
});

wss.on('error', (error) => {
  console.error('[WSS] Server error:', error.message);
});

console.log('✅ WebSocket server initialized');

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PoeVerse Server Running!');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`💬 Chat: /chat/chat.html`);
  console.log(`📡 WebSocket: Active`);
  console.log(`👥 Clients: ${clients.size}`);
  console.log('='.repeat(60) + '\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down gracefully...');
  
  // Close all WebSocket connections
  clients.forEach((client, ws) => {
    ws.close();
  });
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force close after 5 seconds
  setTimeout(() => {
    console.error('Forcing shutdown');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);