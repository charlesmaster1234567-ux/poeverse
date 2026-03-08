const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Check if ws module exists
let WebSocketServer;
try {
  const ws = require('ws');
  WebSocketServer = ws.WebSocketServer || ws.Server;
} catch (error) {
  console.error('❌ ws module not found. Run: npm install ws');
  process.exit(1);
}

// ===== CHAT HISTORY STORAGE =====
const CHAT_HISTORY_FILE = path.join(__dirname, 'chat-history.json');
const MAX_HISTORY_MESSAGES = 500;

let chatHistory = [];

function loadChatHistory() {
  try {
    if (fs.existsSync(CHAT_HISTORY_FILE)) {
      const data = fs.readFileSync(CHAT_HISTORY_FILE, 'utf8');
      chatHistory = JSON.parse(data);
      console.log(`📂 Loaded ${chatHistory.length} messages from history`);
    }
  } catch (error) {
    console.error('❌ Failed to load chat history:', error.message);
    chatHistory = [];
  }
}

function saveChatHistory() {
  try {
    fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify(chatHistory, null, 2));
  } catch (error) {
    console.error('❌ Failed to save chat history:', error.message);
  }
}

function addToHistory(message) {
  chatHistory.push({
    ...message,
    timestamp: Date.now()
  });
  
  if (chatHistory.length > MAX_HISTORY_MESSAGES) {
    chatHistory = chatHistory.slice(-MAX_HISTORY_MESSAGES);
  }
  
  saveChatHistory();
}

// ===== SIMPLE AUTH SYSTEM =====
const USERS_FILE = path.join(__dirname, 'users.json');
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
const SECRET_KEY = crypto.randomBytes(64).toString('hex');

let users = {};
let sessions = {};

// Simple hash function (for demo - use bcrypt in production)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(':');
    const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === newHash;
  } catch {
    return false;
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      console.log(`📂 Loaded ${Object.keys(users).length} users`);
    }
  } catch (error) {
    users = {};
  }
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    }
  } catch {
    sessions = {};
  }
}

function saveSessions() {
  // Clean expired sessions
  const now = Date.now();
  Object.keys(sessions).forEach(token => {
    if (sessions[token].expires < now) {
      delete sessions[token];
    }
  });
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function createSession(userId, username) {
  const token = generateToken();
  const expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  sessions[token] = { userId, username, expires };
  saveSessions();
  return token;
}

function verifySession(token) {
  if (sessions[token] && sessions[token].expires > Date.now()) {
    return sessions[token];
  }
  return null;
}

function logout(token) {
  delete sessions[token];
  saveSessions();
}

// Load auth data on startup
loadUsers();
loadSessions();
loadChatHistory();

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
  let filePath = req.url.split('?')[0];
  const queryParams = new URLSearchParams(req.url.split('?')[1]);
  
  // Default route
  if (filePath === '/') filePath = '/index.html';
  
  // CORS headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // ✅ KEEP-ALIVE ENDPOINT
  if (filePath === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }
  
  // Health check
  if (filePath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      websocket: 'active',
      clients: clients.size,
      users: Object.keys(users).length,
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage().heapUsed / 1024 / 1024,
      timestamp: Date.now()
    }));
    return;
  }
  
  // Chat history endpoint
  if (filePath === '/api/chat-history') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ messages: chatHistory }));
    return;
  }
  
  // Auth endpoints
  if (filePath.startsWith('/api/auth/')) {
    const authPath = filePath.replace('/api/auth/', '');
    
    // Register
    if (authPath === 'register' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { email, password, username } = JSON.parse(body);
          
          if (!email || !password || !username) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'All fields required' }));
            return;
          }
          
          if (users[email]) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Email already registered' }));
            return;
          }
          
          // Create user
          users[email] = {
            email,
            username,
            password: hashPassword(password),
            created: Date.now()
          };
          saveUsers();
          
          // Create session
          const token = createSession(email, username);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            token, 
            user: { email, username } 
          }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
      return;
    }
    
    // Login
    if (authPath === 'login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { email, password } = JSON.parse(body);
          
          const user = users[email];
          if (!user || !verifyPassword(password, user.password)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
            return;
          }
          
          const token = createSession(email, user.username);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            token, 
            user: { email: user.email, username: user.username } 
          }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
      return;
    }
    
    // Logout
    if (authPath === 'logout' && req.method === 'POST') {
      const token = queryParams.get('token');
      if (token) {
        logout(token);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    
    // Verify token
    if (authPath === 'verify' && req.method === 'GET') {
      const token = queryParams.get('token');
      const session = verifySession(token);
      
      if (session) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid: true, user: session }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid: false }));
      }
      return;
    }
    
    // Get user info
    if (authPath === 'me' && req.method === 'GET') {
      const token = queryParams.get('token');
      const session = verifySession(token);
      
      if (session) {
        const user = users[session.userId];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          user: { email: user.email, username: user.username } 
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not authenticated' }));
      }
      return;
    }
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
  path: '/',
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
  
  clients.set(ws, { id, username: `Guest_${id}`, color, authenticated: false });
  
  console.log(`[+] User ${id} connected (Total: ${clients.size})`);

  ws.send(JSON.stringify({ type: 'welcome', id, color }));

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    
    const client = clients.get(ws);
    if (!client) return;

    switch (data.type) {
      case 'join':
        // Support both guest and authenticated
        client.username = (data.username || '').trim().slice(0, 30) || `Guest_${id}`;
        client.color = data.color || client.color;
        client.authenticated = data.authenticated || false;
        
        console.log(`[JOIN] ${client.username} (auth: ${client.authenticated})`);
        
        broadcastAll({
          type: 'user_joined',
          id: client.id,
          username: client.username,
          color: client.color,
          authenticated: client.authenticated,
          users: getUsers(),
          timestamp: Date.now()
        });
        break;

      case 'message':
        const text = (data.text || '').trim().slice(0, 500);
        if (!text) return;
        
        console.log(`[MSG] ${client.username}: ${text.substring(0, 30)}`);
        
        const messageData = {
          type: 'message',
          id: client.id,
          username: client.username,
          color: client.color,
          text,
          authenticated: client.authenticated,
          timestamp: Date.now()
        };
        
        broadcastAll(messageData);
        
        addToHistory({
          id: client.id,
          username: client.username,
          color: client.color,
          text,
          authenticated: client.authenticated,
          timestamp: messageData.timestamp
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
  console.log(`✅ Auth System: Ready`);
  console.log(`✅ Users: ${Object.keys(users).length} registered`);
  console.log('='.repeat(50));
});

server.on('error', (err) => {
  console.error('❌ Server Error:', err.message);
  process.exit(1);
});
