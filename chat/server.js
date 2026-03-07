const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

// ===== HTTP SERVER (serves files) =====
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript'
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/chat.html' : req.url;
  filePath = path.join(__dirname, filePath);
  
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Not Found</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// ===== WEBSOCKET SERVER =====
const wss = new WebSocketServer({ server });

const clients = new Map();
let userIdCounter = 0;

// Random colors for users
const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#F7DC6F', '#82E0AA',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#58D68D'
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

// Broadcast to all clients
const broadcast = (data, excludeWs = null) => {
  const message = JSON.stringify(data);
  clients.forEach((client, ws) => {
    if (ws !== excludeWs && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
};

// Broadcast to all including sender
const broadcastAll = (data) => {
  const message = JSON.stringify(data);
  clients.forEach((client, ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
};

// Get online users
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

// WebSocket connection handler
wss.on('connection', (ws) => {
  const userId = ++userIdCounter;
  const userColor = getRandomColor();

  // Store client data
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
      console.error('Invalid JSON');
      return;
    }

    const client = clients.get(ws);

    switch (data.type) {
      case 'join':
        client.username = data.username.trim().slice(0, 30) || `Guest_${userId}`;
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
        const text = data.text.trim().slice(0, 500);
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
    console.error('WebSocket error:', error.message);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 PoeVerse Chat Server Running!');
  console.log('='.repeat(50));
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`📱 Network: http://<your-ip>:${PORT}`);
  console.log('='.repeat(50) + '\n');
});