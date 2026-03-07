const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

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

  // Parse URL
  let filePath = req.url;
  
  // Remove query string
  const queryIndex = filePath.indexOf('?');
  if (queryIndex !== -1) {
    filePath = filePath.substring(0, queryIndex);
  }

  // Default routes
  if (filePath === '/') {
    filePath = '/index.html';
  }

  // Build full path
  const fullPath = path.join(__dirname, filePath);

  // Security check - prevent directory traversal
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Get file extension
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Read and serve file
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found - try .html extension
        fs.readFile(fullPath + '.html', (err2, content2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Not Found</h1>');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 - Internal Server Error');
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

// ===== WEBSOCKET SERVER FOR CHAT =====
const wss = new WebSocketServer({ server });

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
    if (ws !== excludeWs && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
};

const broadcastAll = (data) => {
  const message = JSON.stringify(data);
  clients.forEach((clientData, ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
};

wss.on('connection', (ws, req) => {
  const userId = ++userIdCounter;
  const userColor = getRandomColor();

  clients.set(ws, {
    id: userId,
    username: `Guest_${userId}`,
    color: userColor
  });

  console.log(`[+] User ${userId} connected (Total: ${clients.size})`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    id: userId,
    color: userColor
  }));

  // Handle messages
  ws.on('message', (rawData) => {
    let data;
    try {
      data = JSON.parse(rawData.toString());
    } catch (e) {
      console.error('[WS] Invalid JSON received');
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

        console.log(`[MSG] ${client.username}: ${text.substring(0, 50)}`);

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
        console.log('[WS] Unknown message type:', data.type);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      console.log(`[-] ${client.username} disconnected (Total: ${clients.size - 1})`);
      
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
    console.error('[WS] Error:', error.message);
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PoeVerse Server Running!');
  console.log('='.repeat(60));
  console.log(`📍 Local:     http://localhost:${PORT}`);
  console.log(`💬 Chat:      http://localhost:${PORT}/chat/chat.html`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log('='.repeat(60) + '\n');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});