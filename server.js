const http = require('http');
const fs = require('fs');
const path = require('path');

// Check if ws module exists
let WebSocketServer;
try {
  const ws = require('ws');
  WebSocketServer = ws.WebSocketServer || ws.Server;
} catch (error) {
  console.error('❌ ws module not found. Run: npm install ws');
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
  let filePath = req.url.split('?')[0]; // Remove query params
  
  // Default route
  if (filePath === '/') filePath = '/index.html';
  
  // Health check
  if (filePath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      websocket: 'active',
      clients: clients.size,
      uptime: Math.floor(process.uptime())
    }));
    return;
  }

  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// ===== WEBSOCKET SERVER =====
const wss = new WebSocketServer({ 
  server,
  path: '/',  // Accept connections on root path
  perMessageDeflate: false,
  clientTracking: true
});

const clients = new Map();
let userIdCounter = 0;

const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F7DC6F','#82E0AA'];
const getColor = () => colors[Math.floor(Math.random() * colors.length)];

const getUsers = () => Array.from(clients.values()).map(c => ({
  id: c.id, username: c.username, color: c.color
}));

const broadcast = (data, exclude = null) => {
  const msg = JSON.stringify(data);
  clients.forEach((c, ws) => {
    if (ws !== exclude && ws.readyState === 1) {
      ws.send(msg);
    }
  });
};

const broadcastAll = (data) => {
  const msg = JSON.stringify(data);
  clients.forEach((c, ws) => {
    if (ws.readyState === 1) ws.send(msg);
  });
};

wss.on('connection', (ws, req) => {
  const id = ++userIdCounter;
  const color = getColor();
  
  clients.set(ws, { id, username: `Guest_${id}`, color });
  
  console.log(`[+] User ${id} connected (Total: ${clients.size})`);

  ws.send(JSON.stringify({ type: 'welcome', id, color }));

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    
    const client = clients.get(ws);
    if (!client) return;

    switch (data.type) {
      case 'join':
        client.username = (data.username || '').trim().slice(0, 30) || `Guest_${id}`;
        console.log(`[JOIN] ${client.username}`);
        broadcastAll({
          type: 'user_joined',
          id: client.id,
          username: client.username,
          color: client.color,
          users: getUsers(),
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
          text,
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
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      console.log(`[-] ${client.username} left (Total: ${clients.size - 1})`);
      clients.delete(ws);
      broadcastAll({
        type: 'user_left',
        id: client.id,
        username: client.username,
        users: getUsers(),
        timestamp: Date.now()
      });
    }
  });

  ws.on('error', (err) => console.error('[WS Error]', err.message));
});

wss.on('error', (err) => console.error('[WSS Error]', err.message));

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 PoeVerse Server');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`✅ HTTP Server: Ready`);
  console.log(`✅ WebSocket Server: Ready`);
  console.log('='.repeat(50));
});

server.on('error', (err) => {
  console.error('❌ Server Error:', err.message);
  process.exit(1);
});