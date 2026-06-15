const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ===== BAD WORDS FILTER =====
let badWordsFilter;
try {
  const BadWords = require('bad-words');
  badWordsFilter = new BadWords();
  // Add extra custom words here:
  // badWordsFilter.addWords('word1', 'word2');
  console.log('✅ Bad words filter loaded');
} catch(e) {
  console.warn('⚠️ bad-words package not found, using manual filter');
  badWordsFilter = null;
}

// Check if ws module exists
let WebSocketServer;
try {
  const ws = require('ws');
  WebSocketServer = ws.WebSocketServer || ws.Server;
} catch (error) {
  console.error('❌ ws module not found. Run: npm install ws');
  process.exit(1);
}

// ===== UUID GENERATOR (no extra package needed) =====
function generateUUID() {
  return crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
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
  chatHistory.push({ ...message, timestamp: Date.now() });
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
  } catch { return false; }
}

function generateToken() { return crypto.randomBytes(32).toString('hex'); }

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      console.log(`📂 Loaded ${Object.keys(users).length} users`);
    }
  } catch { users = {}; }
}

function saveUsers() { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); }

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    }
  } catch { sessions = {}; }
}

function saveSessions() {
  const now = Date.now();
  Object.keys(sessions).forEach(token => { if (sessions[token].expires < now) delete sessions[token]; });
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function createSession(userId, username) {
  const token = generateToken();
  const expires = Date.now() + (7 * 24 * 60 * 60 * 1000);
  sessions[token] = { userId, username, expires };
  saveSessions();
  return token;
}

function verifySession(token) {
  if (sessions[token] && sessions[token].expires > Date.now()) return sessions[token];
  return null;
}

function logout(token) { delete sessions[token]; saveSessions(); }

// Load on startup
loadUsers();
loadSessions();
loadChatHistory();

// ===== CHATWAVE ADMIN STATE =====
const ADMIN_CONFIG = {
  username: 'admin',
  passwordHash: crypto.createHash('sha256').update('ChatWaveAdmin2026!').digest('hex'),
  sessionExpiry: 24 * 60 * 60 * 1000,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000
};

const adminSessions = new Map();
const loginAttempts = new Map();
const bannedIPs = new Set();
const suspendedUsers = new Map();
const mutedUsers = new Map();
const ipAddressMap = new Map();
const userStats = new Map();
const serverLogs = [];
const announcements = [];
const slowModeTimers = new Map();
const userWarnings = new Map();
const adminWsClients = new Set();

let serverSettings = {
  maxMessageLength: 2000,
  slowMode: 0,
  registrationOpen: true,
  maintenanceMode: false,
  wordFilter: [],
  welcomeMessage: 'Welcome to ChatWave! Be respectful and have fun.',
  maxFileSize: 5 * 1024 * 1024
};

// ChatWave channels & DMs
const cwChannels = { general: [], random: [], tech: [] };
const cwDirectMessages = {};
const cwUsers = {};

// ===== ADMIN HELPER FUNCTIONS =====
function addLog(type, message, details = null) {
  const log = { id: generateUUID(), timestamp: Date.now(), type, message, details };
  serverLogs.push(log);
  if (serverLogs.length > 1000) serverLogs.splice(0, serverLogs.length - 1000);
  broadcastToAdmins({ type: 'log', log });
}

function broadcastToAdmins(data) {
  const msg = JSON.stringify(data);
  adminWsClients.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}

function cwBroadcast(data, excludeWs = null) {
  const msg = JSON.stringify(data);
  Object.values(cwUsers).forEach(u => {
    if (u.ws && u.ws !== excludeWs && u.ws.readyState === 1 && !u.ws.__isAdmin) {
      u.ws.send(msg);
    }
  });
}

function cwSendToUser(username, data) {
  const user = cwUsers[username];
  if (user && user.ws && user.ws.readyState === 1) user.ws.send(JSON.stringify(data));
}

function getDMKey(u1, u2) { return [u1, u2].sort().join(':'); }

function cwBroadcastUsers() {
  const userList = {};
  for (const [name, data] of Object.entries(cwUsers)) userList[name] = { color: data.color };
  cwBroadcast({ type: 'users', users: userList });
  broadcastToAdmins({ type: 'users_update', users: userList, count: Object.keys(userList).length });
}

function cwBroadcastSystemMessage(text, channel = 'general') {
  const msg = { id: generateUUID(), type: 'message', channel, username: 'System', text, system: true, timestamp: Date.now(), color: '#888' };
  if (cwChannels[channel]) cwChannels[channel].push(msg);
  cwBroadcast(msg);
}

function checkWordFilter(text) {
  if (!text) return text;
  let filtered = text;

  // ---- Use bad-words package if available ----
  if (badWordsFilter) {
    try {
      filtered = badWordsFilter.clean(filtered);
    } catch(e) {
      // If cleaning fails (e.g. word too short), keep original
    }
  }

  // ---- Also apply manual word filter from admin settings ----
  if (serverSettings.wordFilter && serverSettings.wordFilter.length > 0) {
    serverSettings.wordFilter.forEach(word => {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
  }

  return filtered;
}

function isUserSuspended(username) {
  if (!suspendedUsers.has(username)) return false;
  const s = suspendedUsers.get(username);
  if (s.until && Date.now() > s.until) { suspendedUsers.delete(username); return false; }
  return true;
}

function isUserMuted(username) {
  if (!mutedUsers.has(username)) return false;
  const m = mutedUsers.get(username);
  if (m.until && Date.now() > m.until) { mutedUsers.delete(username); return false; }
  return true;
}

function authenticateAdmin(req) {
  const token = req.headers['x-admin-token'];
  if (!token || !adminSessions.has(token)) return false;
  const session = adminSessions.get(token);
  if (Date.now() - session.createdAt > ADMIN_CONFIG.sessionExpiry) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

// ===== MIME TYPES =====
const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json'
};

// ===== HELPER: Parse request body =====
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ===== HELPER: Send JSON response =====
function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ===== HTTP SERVER =====
const server = http.createServer(async (req, res) => {
  let filePath = req.url.split('?')[0];
  const queryParams = new URLSearchParams(req.url.split('?')[1] || '');

  if (filePath === '/') filePath = '/index.html';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // =====================================================
  // CHATWAVE ADMIN API ROUTES
  // =====================================================

  // Admin login
  if (filePath === '/admin/api/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const ip = req.socket.remoteAddress;
    if (bannedIPs.has(ip)) return sendJSON(res, 403, { error: 'IP banned' });
    const attempts = loginAttempts.get(ip);
    if (attempts && attempts.count >= ADMIN_CONFIG.maxLoginAttempts) {
      const timeSince = Date.now() - attempts.lastAttempt;
      if (timeSince < ADMIN_CONFIG.lockoutDuration) {
        const remaining = Math.ceil((ADMIN_CONFIG.lockoutDuration - timeSince) / 60000);
        return sendJSON(res, 429, { error: `Too many attempts. Try again in ${remaining} minutes.` });
      }
      loginAttempts.delete(ip);
    }
    const hash = crypto.createHash('sha256').update(body.password || '').digest('hex');
    if (body.username === ADMIN_CONFIG.username && hash === ADMIN_CONFIG.passwordHash) {
      const token = crypto.randomBytes(48).toString('hex');
      adminSessions.set(token, { createdAt: Date.now(), ip });
      loginAttempts.delete(ip);
      addLog('auth', `Admin logged in from ${ip}`);
      return sendJSON(res, 200, { token, expiresIn: ADMIN_CONFIG.sessionExpiry });
    }
    const current = loginAttempts.get(ip) || { count: 0 };
    current.count++; current.lastAttempt = Date.now();
    loginAttempts.set(ip, current);
    return sendJSON(res, 401, { error: 'Invalid credentials', attemptsRemaining: ADMIN_CONFIG.maxLoginAttempts - current.count });
  }

  // Admin logout
  if (filePath === '/admin/api/logout' && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    adminSessions.delete(req.headers['x-admin-token']);
    addLog('auth', 'Admin logged out');
    return sendJSON(res, 200, { success: true });
  }

  // Admin verify
  if (filePath === '/admin/api/verify' && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    return sendJSON(res, 200, { valid: true });
  }

  // Admin stats
  if (filePath === '/admin/api/stats' && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const totalMessages =
      Object.values(cwChannels).reduce((s, m) => s + m.length, 0) +
      Object.values(cwDirectMessages).reduce((s, m) => s + m.length, 0);
    return sendJSON(res, 200, {
      onlineUsers: Object.keys(cwUsers).length,
      totalMessages, totalChannels: Object.keys(cwChannels).length,
      suspendedCount: suspendedUsers.size, mutedCount: mutedUsers.size,
      uptime: process.uptime(), memoryUsage: process.memoryUsage(), serverSettings,
      // Also include TheLongAfter stats
      TheLongAfterUsers: clients.size,
      TheLongAfterMessages: chatHistory.length
    });
  }

  // Admin get users
  if (filePath === '/admin/api/users' && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const allUsers = {};
    for (const [name, data] of Object.entries(cwUsers)) {
      allUsers[name] = { username: name, color: data.color, online: true, ip: ipAddressMap.get(name) || 'Unknown', suspended: suspendedUsers.get(name) || null, muted: mutedUsers.get(name) || null, stats: userStats.get(name) || { messageCount: 0 }, warnings: userWarnings.get(name) || [] };
    }
    for (const [name, stats] of userStats.entries()) {
      if (!allUsers[name]) {
        allUsers[name] = { username: name, color: '#888', online: false, ip: ipAddressMap.get(name) || 'Unknown', suspended: suspendedUsers.get(name) || null, muted: mutedUsers.get(name) || null, stats, warnings: userWarnings.get(name) || [] };
      }
    }
    return sendJSON(res, 200, Object.values(allUsers));
  }

  // Admin kick user
  if (filePath.match(/^\/admin\/api\/users\/(.+)\/kick$/) && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const username = decodeURIComponent(filePath.match(/^\/admin\/api\/users\/(.+)\/kick$/)[1]);
    const body = await parseBody(req);
    const reason = body.reason || 'Kicked by admin';
    if (!cwUsers[username]) return sendJSON(res, 404, { error: 'User not online' });
    cwSendToUser(username, { type: 'admin_action', action: 'kick', reason, message: `You have been kicked: ${reason}` });
    setTimeout(() => { if (cwUsers[username]?.ws) cwUsers[username].ws.close(1000, 'Kicked'); }, 500);
    addLog('moderation', `Kicked user: ${username}`, { reason });
    cwBroadcastSystemMessage(`${username} has been removed from the chat.`);
    return sendJSON(res, 200, { success: true });
  }

  // Admin suspend user
  if (filePath.match(/^\/admin\/api\/users\/(.+)\/suspend$/) && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const username = decodeURIComponent(filePath.match(/^\/admin\/api\/users\/(.+)\/suspend$/)[1]);
    const body = await parseBody(req);
    const { duration, reason } = body;
    const until = duration ? Date.now() + duration * 60000 : null;
    suspendedUsers.set(username, { until, reason: reason || 'Suspended by admin', suspendedAt: Date.now() });
    if (cwUsers[username]) {
      cwSendToUser(username, { type: 'admin_action', action: 'suspend', reason, until, message: `You have been suspended${duration ? ` for ${duration} minutes` : ' permanently'}: ${reason || 'No reason provided'}` });
      setTimeout(() => { if (cwUsers[username]?.ws) cwUsers[username].ws.close(1000, 'Suspended'); }, 500);
    }
    addLog('moderation', `Suspended user: ${username}`, { duration, reason, until });
    return sendJSON(res, 200, { success: true });
  }

  // Admin unsuspend user
  if (filePath.match(/^\/admin\/api\/users\/(.+)\/unsuspend$/) && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const username = decodeURIComponent(filePath.match(/^\/admin\/api\/users\/(.+)\/unsuspend$/)[1]);
    suspendedUsers.delete(username);
    addLog('moderation', `Unsuspended user: ${username}`);
    return sendJSON(res, 200, { success: true });
  }

  // Admin mute user
  if (filePath.match(/^\/admin\/api\/users\/(.+)\/mute$/) && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const username = decodeURIComponent(filePath.match(/^\/admin\/api\/users\/(.+)\/mute$/)[1]);
    const body = await parseBody(req);
    const { duration, reason } = body;
    const until = duration ? Date.now() + duration * 60000 : null;
    mutedUsers.set(username, { until, reason: reason || 'Muted by admin', mutedAt: Date.now() });
    if (cwUsers[username]) cwSendToUser(username, { type: 'admin_action', action: 'mute', reason, until, message: `You have been muted${duration ? ` for ${duration} minutes` : ' permanently'}: ${reason || 'No reason provided'}` });
    addLog('moderation', `Muted user: ${username}`, { duration, reason });
    return sendJSON(res, 200, { success: true });
  }

  // Admin unmute user
  if (filePath.match(/^\/admin\/api\/users\/(.+)\/unmute$/) && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const username = decodeURIComponent(filePath.match(/^\/admin\/api\/users\/(.+)\/unmute$/)[1]);
    mutedUsers.delete(username);
    if (cwUsers[username]) cwSendToUser(username, { type: 'admin_action', action: 'unmute', message: 'You have been unmuted.' });
    addLog('moderation', `Unmuted user: ${username}`);
    return sendJSON(res, 200, { success: true });
  }

  // Admin warn user
  if (filePath.match(/^\/admin\/api\/users\/(.+)\/warn$/) && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const username = decodeURIComponent(filePath.match(/^\/admin\/api\/users\/(.+)\/warn$/)[1]);
    const body = await parseBody(req);
    const { reason } = body;
    if (!userWarnings.has(username)) userWarnings.set(username, []);
    userWarnings.get(username).push({ reason: reason || 'Warning from admin', timestamp: Date.now(), by: 'admin' });
    if (cwUsers[username]) cwSendToUser(username, { type: 'admin_action', action: 'warn', reason, message: `⚠️ Warning: ${reason || 'Please follow the rules.'}` });
    addLog('moderation', `Warned user: ${username}`, { reason });
    return sendJSON(res, 200, { success: true, totalWarnings: userWarnings.get(username).length });
  }

  // Admin ban IP
  if (filePath.match(/^\/admin\/api\/users\/(.+)\/ban-ip$/) && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const username = decodeURIComponent(filePath.match(/^\/admin\/api\/users\/(.+)\/ban-ip$/)[1]);
    const body = await parseBody(req);
    const { reason } = body;
    const ip = ipAddressMap.get(username);
    if (ip) { bannedIPs.add(ip); addLog('moderation', `Banned IP for user: ${username}`, { ip, reason }); }
    suspendedUsers.set(username, { until: null, reason: reason || 'IP Banned', suspendedAt: Date.now() });
    if (cwUsers[username]) {
      cwSendToUser(username, { type: 'admin_action', action: 'ban', message: `You have been permanently banned: ${reason || 'No reason provided'}` });
      setTimeout(() => { if (cwUsers[username]?.ws) cwUsers[username].ws.close(1000, 'Banned'); }, 500);
    }
    return sendJSON(res, 200, { success: true, ip });
  }

  // Admin purge user messages
  if (filePath.match(/^\/admin\/api\/users\/(.+)\/purge$/) && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const username = decodeURIComponent(filePath.match(/^\/admin\/api\/users\/(.+)\/purge$/)[1]);
    let purged = 0;
    for (const [ch, msgs] of Object.entries(cwChannels)) {
      const ids = msgs.filter(m => m.username === username).map(m => m.id);
      cwChannels[ch] = msgs.filter(m => m.username !== username);
      purged += ids.length;
      ids.forEach(id => cwBroadcast({ type: 'delete', id, channel: ch }));
    }
    for (const [key, msgs] of Object.entries(cwDirectMessages)) {
      const ids = msgs.filter(m => m.from === username).map(m => m.id);
      cwDirectMessages[key] = msgs.filter(m => m.from !== username);
      purged += ids.length;
      const parts = key.split(':');
      ids.forEach(id => parts.forEach(u => cwSendToUser(u, { type: 'delete', id, dm: parts.find(p => p !== u) || u })));
    }
    addLog('moderation', `Purged ${purged} messages from ${username}`);
    return sendJSON(res, 200, { success: true, purged });
  }

  // Admin get channel messages
  if (filePath.match(/^\/admin\/api\/messages\/(.+)$/) && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const channel = filePath.match(/^\/admin\/api\/messages\/(.+)$/)[1];
    return sendJSON(res, 200, (cwChannels[channel] || []).slice(-200));
  }

  // Admin delete message
  if (filePath.match(/^\/admin\/api\/messages\/(.+)$/) && req.method === 'DELETE') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const id = filePath.match(/^\/admin\/api\/messages\/(.+)$/)[1];
    const channel = queryParams.get('channel');
    const dmKey = queryParams.get('dmKey');
    let found = false;
    if (dmKey && cwDirectMessages[dmKey]) {
      const idx = cwDirectMessages[dmKey].findIndex(m => m.id === id);
      if (idx !== -1) {
        cwDirectMessages[dmKey].splice(idx, 1);
        const parts = dmKey.split(':');
        parts.forEach(u => cwSendToUser(u, { type: 'delete', id, dm: parts.find(p => p !== u) || u }));
        found = true;
      }
    } else {
      for (const ch of (channel ? [channel] : Object.keys(cwChannels))) {
        if (!cwChannels[ch]) continue;
        const idx = cwChannels[ch].findIndex(m => m.id === id);
        if (idx !== -1) { cwChannels[ch].splice(idx, 1); cwBroadcast({ type: 'delete', id, channel: ch }); found = true; break; }
      }
    }
    if (!found) return sendJSON(res, 404, { error: 'Message not found' });
    return sendJSON(res, 200, { success: true });
  }

  // Admin get DMs list
  if (filePath === '/admin/api/dms' && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const summary = {};
    for (const [key, msgs] of Object.entries(cwDirectMessages)) {
      summary[key] = { participants: key.split(':'), messageCount: msgs.length, lastMessage: msgs[msgs.length - 1] || null };
    }
    return sendJSON(res, 200, summary);
  }

  // Admin get DM messages
  if (filePath.match(/^\/admin\/api\/dms\/(.+)$/) && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const key = filePath.match(/^\/admin\/api\/dms\/(.+)$/)[1];
    return sendJSON(res, 200, (cwDirectMessages[key] || []).slice(-200));
  }

  // Admin clear channel
  if (filePath.match(/^\/admin\/api\/channels\/(.+)\/clear$/) && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const channel = filePath.match(/^\/admin\/api\/channels\/(.+)\/clear$/)[1];
    if (!cwChannels[channel]) return sendJSON(res, 404, { error: 'Channel not found' });
    const ids = cwChannels[channel].map(m => m.id);
    cwChannels[channel] = [];
    ids.forEach(id => cwBroadcast({ type: 'delete', id, channel }));
    cwBroadcastSystemMessage(`Channel #${channel} has been cleared by an administrator.`, channel);
    addLog('moderation', `Cleared channel #${channel}`, { messagesRemoved: ids.length });
    return sendJSON(res, 200, { success: true, cleared: ids.length });
  }

  // Admin delete channel
  if (filePath.match(/^\/admin\/api\/channels\/(.+)$/) && req.method === 'DELETE') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const channel = filePath.match(/^\/admin\/api\/channels\/(.+)$/)[1];
    if (channel === 'general') return sendJSON(res, 400, { error: 'Cannot delete general channel' });
    if (!cwChannels[channel]) return sendJSON(res, 404, { error: 'Channel not found' });
    delete cwChannels[channel];
    cwBroadcast({ type: 'channel_deleted', channel });
    addLog('moderation', `Deleted channel #${channel}`);
    return sendJSON(res, 200, { success: true });
  }

  // Admin get channels
  if (filePath === '/admin/api/channels' && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const chList = {};
    for (const [name, msgs] of Object.entries(cwChannels)) {
      chList[name] = { name, messageCount: msgs.length, lastActivity: msgs[msgs.length - 1]?.timestamp || null };
    }
    return sendJSON(res, 200, chList);
  }

  // Admin create channel
  if (filePath === '/admin/api/channels' && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const body = await parseBody(req);
    const clean = (body.name || '').toLowerCase().replace(/[^a-z0-9\-_]/g, '');
    if (!clean || cwChannels[clean]) return sendJSON(res, 400, { error: 'Invalid or existing channel name' });
    cwChannels[clean] = [];
    cwBroadcast({ type: 'channel_created', channel: clean });
    addLog('admin', `Created channel #${clean}`);
    return sendJSON(res, 200, { success: true, channel: clean });
  }

  // Admin announce
  if (filePath === '/admin/api/announce' && req.method === 'POST') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const body = await parseBody(req);
    const { text } = body;
    if (!text) return sendJSON(res, 400, { error: 'Text required' });
    announcements.push({ id: generateUUID(), text, timestamp: Date.now() });
    cwBroadcast({ type: 'announcement', text, timestamp: Date.now() });
    cwBroadcastSystemMessage(`📢 Announcement: ${text}`);
    addLog('admin', `Broadcast announcement: ${text}`);
    return sendJSON(res, 200, { success: true });
  }

  // Admin get settings
  if (filePath === '/admin/api/settings' && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    return sendJSON(res, 200, serverSettings);
  }

  // Admin update settings
  if (filePath === '/admin/api/settings' && req.method === 'PUT') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const body = await parseBody(req);
    for (const [key, value] of Object.entries(body)) {
      if (key in serverSettings) serverSettings[key] = value;
    }
    addLog('admin', 'Updated server settings', body);
    return sendJSON(res, 200, serverSettings);
  }

  // Admin get logs
  if (filePath === '/admin/api/logs' && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    let logs = serverLogs;
    if (queryParams.get('type')) logs = logs.filter(l => l.type === queryParams.get('type'));
    return sendJSON(res, 200, logs.slice(-(parseInt(queryParams.get('limit')) || 100)));
  }

  // Admin clear logs
  if (filePath === '/admin/api/logs' && req.method === 'DELETE') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    serverLogs.length = 0;
    return sendJSON(res, 200, { success: true });
  }

  // Admin get banned IPs
  if (filePath === '/admin/api/banned-ips' && req.method === 'GET') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    return sendJSON(res, 200, Array.from(bannedIPs));
  }

  // Admin unban IP
  if (filePath.match(/^\/admin\/api\/banned-ips\/(.+)$/) && req.method === 'DELETE') {
    if (!authenticateAdmin(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
    const ip = decodeURIComponent(filePath.match(/^\/admin\/api\/banned-ips\/(.+)$/)[1]);
    bannedIPs.delete(ip);
    addLog('admin', `Unbanned IP: ${ip}`);
    return sendJSON(res, 200, { success: true });
  }

  // =====================================================
  // thelongafter ORIGINAL ROUTES
  // =====================================================

  if (filePath === '/ping') {
    return sendJSON(res, 200, { status: 'ok', timestamp: Date.now() });
  }

  if (filePath === '/health') {
    return sendJSON(res, 200, {
      status: 'ok', websocket: 'active',
      clients: clients.size, users: Object.keys(users).length,
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage().heapUsed / 1024 / 1024,
      timestamp: Date.now()
    });
  }

  if (filePath === '/test') {
    return sendJSON(res, 200, { status: 'OK', time: new Date().toISOString(), message: 'Server is running!' });
  }

  if (filePath === '/api/chat-history') {
    return sendJSON(res, 200, { messages: chatHistory });
  }

  if (filePath.startsWith('/api/auth/')) {
    const authPath = filePath.replace('/api/auth/', '');

    if (authPath === 'register' && req.method === 'POST') {
      const body = await parseBody(req);
      const { email, password, username } = body;
      if (!email || !password || !username) return sendJSON(res, 400, { error: 'All fields required' });
      if (users[email]) return sendJSON(res, 400, { error: 'Email already registered' });
      users[email] = { email, username, password: hashPassword(password), created: Date.now() };
      saveUsers();
      const token = createSession(email, username);
      return sendJSON(res, 200, { success: true, token, user: { email, username } });
    }

    if (authPath === 'login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;
      const user = users[email];
      if (!user || !verifyPassword(password, user.password)) return sendJSON(res, 401, { error: 'Invalid credentials' });
      const token = createSession(email, user.username);
      return sendJSON(res, 200, { success: true, token, user: { email: user.email, username: user.username } });
    }

    if (authPath === 'logout' && req.method === 'POST') {
      const token = queryParams.get('token');
      if (token) logout(token);
      return sendJSON(res, 200, { success: true });
    }

    if (authPath === 'verify' && req.method === 'GET') {
      const token = queryParams.get('token');
      const session = verifySession(token);
      if (session) return sendJSON(res, 200, { valid: true, user: session });
      return sendJSON(res, 200, { valid: false });
    }

    if (authPath === 'me' && req.method === 'GET') {
      const token = queryParams.get('token');
      const session = verifySession(token);
      if (session) {
        const user = users[session.userId];
        return sendJSON(res, 200, { user: { email: user.email, username: user.username } });
      }
      return sendJSON(res, 401, { error: 'Not authenticated' });
    }
  }

  // =====================================================
  // SERVE HTML PAGES
  // =====================================================

  // Admin panel page
  if (filePath === '/admin') {
    const adminPath = path.join(__dirname, 'admin.html');
    if (fs.existsSync(adminPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(fs.readFileSync(adminPath));
    }
    return sendJSON(res, 404, { error: 'admin.html not found' });
  }

  // Chat page
  if (filePath === '/chat') {
    const chatPath = path.join(__dirname, 'chat.html');
    if (fs.existsSync(chatPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(fs.readFileSync(chatPath));
    }
    return sendJSON(res, 404, { error: 'chat.html not found' });
  }

  // =====================================================
  // SERVE STATIC FILES
  // =====================================================
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
const wss = new WebSocketServer({ server, perMessageDeflate: false, clientTracking: true });

const clients = new Map();
let userIdCounter = 0;
const userSessions = new Map();
const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F7DC6F','#82E0AA'];
const getColor = () => colors[Math.floor(Math.random() * colors.length)];

const getUsers = () => {
  const uniqueUsers = [];
  const seen = new Set();
  userSessions.forEach((session) => {
    if (!seen.has(session.username.toLowerCase())) {
      seen.add(session.username.toLowerCase());
      uniqueUsers.push({ id: session.id, username: session.username, color: session.color });
    }
  });
  return uniqueUsers;
};

const broadcastPV = (data, exclude = null) => {
  const msg = JSON.stringify(data);
  userSessions.forEach((session, ws) => {
    if (ws !== exclude && ws.readyState === 1) ws.send(msg);
  });
};

const broadcastAllPV = (data) => {
  const msg = JSON.stringify(data);
  userSessions.forEach((session, ws) => { if (ws.readyState === 1) ws.send(msg); });
};

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const adminToken = url.searchParams.get('admin_token');

  // ===== CHATWAVE ADMIN WEBSOCKET =====
  if (adminToken && adminSessions.has(adminToken)) {
    ws.__isAdmin = true;
    adminWsClients.add(ws);
    ws.on('close', () => adminWsClients.delete(ws));
    ws.on('error', () => adminWsClients.delete(ws));
    ws.send(JSON.stringify({ type: 'admin_connected' }));
    return;
  }

  // ===== CHATWAVE USER WEBSOCKET =====
  // Check if connecting to /chat path
  if (url.pathname === '/chat' || url.searchParams.get('app') === 'chatwave') {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (bannedIPs.has(clientIP)) {
      ws.send(JSON.stringify({ type: 'error', message: 'You have been banned.' }));
      ws.close(1000, 'Banned');
      return;
    }

    let currentUsername = null;

    ws.on('message', (rawData) => {
      let data;
      try { data = JSON.parse(rawData.toString()); } catch { return; }

      switch (data.type) {
        case 'join': {
          const username = (data.username || '').trim();
          if (!username || username.length > 20) return ws.send(JSON.stringify({ type: 'error', message: 'Invalid username' }));
          if (serverSettings.maintenanceMode) return ws.send(JSON.stringify({ type: 'error', message: 'Server is under maintenance.' }));
          if (isUserSuspended(username)) {
            const s = suspendedUsers.get(username);
            const tl = s.until ? Math.ceil((s.until - Date.now()) / 60000) : 'permanently';
            return ws.send(JSON.stringify({ type: 'error', message: `You are suspended${typeof tl === 'number' ? ` for ${tl} more minutes` : ' permanently'}: ${s.reason}` }));
          }
          if (cwUsers[username]) return ws.send(JSON.stringify({ type: 'error', message: 'Username already taken' }));
          if (['admin', 'system', 'moderator', 'server'].includes(username.toLowerCase())) return ws.send(JSON.stringify({ type: 'error', message: 'That username is reserved' }));

          currentUsername = username;
          cwUsers[username] = { ws, color: data.color || '#6C63FF' };
          ipAddressMap.set(username, clientIP);
          if (!userStats.has(username)) userStats.set(username, { messageCount: 0, joinedAt: Date.now(), lastActive: Date.now() });
          else userStats.get(username).lastActive = Date.now();

          cwBroadcastUsers();
          if (serverSettings.welcomeMessage) ws.send(JSON.stringify({ type: 'admin_action', action: 'welcome', message: serverSettings.welcomeMessage }));
          if (isUserMuted(username)) ws.send(JSON.stringify({ type: 'admin_action', action: 'mute_notice', message: `You are currently muted: ${mutedUsers.get(username).reason}` }));
          ws.send(JSON.stringify({ type: 'history', channel: 'general', messages: cwChannels.general.slice(-100) }));
          for (const ch of Object.keys(cwChannels)) {
            if (!['general', 'random', 'tech'].includes(ch)) ws.send(JSON.stringify({ type: 'channel_created', channel: ch }));
          }
          const joinMsg = { id: generateUUID(), type: 'message', channel: 'general', username: 'System', text: `${username} has joined the chat`, system: true, timestamp: Date.now(), color: '#888' };
          cwChannels.general.push(joinMsg);
          cwBroadcast(joinMsg);
          cwBroadcast({ type: 'user_joined', username }, ws);
          addLog('connection', `${username} joined ChatWave from ${clientIP}`);
          break;
        }

        case 'message': {
          if (!currentUsername) return;
          if (isUserMuted(currentUsername)) return ws.send(JSON.stringify({ type: 'error', message: 'You are muted.' }));
          if (serverSettings.slowMode > 0) {
            const last = slowModeTimers.get(currentUsername);
            if (last && Date.now() - last < serverSettings.slowMode * 1000) {
              const wait = Math.ceil((serverSettings.slowMode * 1000 - (Date.now() - last)) / 1000);
              return ws.send(JSON.stringify({ type: 'error', message: `Slow mode: wait ${wait}s` }));
            }
          }
          if (data.text && data.text.length > serverSettings.maxMessageLength) return ws.send(JSON.stringify({ type: 'error', message: `Message too long.` }));
          const channel = data.channel || 'general';
          if (!cwChannels[channel]) cwChannels[channel] = [];
          const msg = {
            id: generateUUID(), type: 'message', channel, username: currentUsername,
            text: checkWordFilter(data.text || ''), file: data.file || null,
            replyTo: data.replyTo || null, replyText: data.replyText || null, replyUser: data.replyUser || null,
            reactions: {}, edited: false, timestamp: Date.now(), color: cwUsers[currentUsername].color
          };
          cwChannels[channel].push(msg);
          if (cwChannels[channel].length > 500) cwChannels[channel] = cwChannels[channel].slice(-500);
          slowModeTimers.set(currentUsername, Date.now());
          const stats = userStats.get(currentUsername);
          if (stats) { stats.messageCount++; stats.lastActive = Date.now(); }
          cwBroadcast(msg);
          broadcastToAdmins({ type: 'new_message', message: msg });
          break;
        }

        case 'dm': {
          if (!currentUsername) return;
          if (isUserMuted(currentUsername)) return ws.send(JSON.stringify({ type: 'error', message: 'You are muted.' }));
          if (!data.to || !cwUsers[data.to]) return ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
          const dmKey = getDMKey(currentUsername, data.to);
          if (!cwDirectMessages[dmKey]) cwDirectMessages[dmKey] = [];
          const msg = {
            id: generateUUID(), type: 'dm', from: currentUsername, to: data.to,
            text: checkWordFilter(data.text || ''), file: data.file || null,
            replyTo: data.replyTo || null, replyText: data.replyText || null, replyUser: data.replyUser || null,
            reactions: {}, edited: false, timestamp: Date.now(), color: cwUsers[currentUsername].color
          };
          cwDirectMessages[dmKey].push(msg);
          if (cwDirectMessages[dmKey].length > 500) cwDirectMessages[dmKey] = cwDirectMessages[dmKey].slice(-500);
          cwSendToUser(currentUsername, msg);
          cwSendToUser(data.to, msg);
          const stats = userStats.get(currentUsername);
          if (stats) { stats.messageCount++; stats.lastActive = Date.now(); }
          broadcastToAdmins({ type: 'new_dm', message: msg });
          break;
        }

        case 'get_history': {
          if (!currentUsername) return;
          const ch = data.channel || 'general';
          if (!cwChannels[ch]) cwChannels[ch] = [];
          ws.send(JSON.stringify({ type: 'history', channel: ch, messages: cwChannels[ch].slice(-100) }));
          break;
        }

        case 'get_dm_history': {
          if (!currentUsername) return;
          const dmKey = getDMKey(currentUsername, data.user);
          if (!cwDirectMessages[dmKey]) cwDirectMessages[dmKey] = [];
          ws.send(JSON.stringify({ type: 'history', dm: data.user, messages: cwDirectMessages[dmKey].slice(-100) }));
          break;
        }

        case 'typing': {
          if (!currentUsername) return;
          const td = { type: 'typing', username: currentUsername, channel: data.channel || null, dm: data.dm || null };
          data.dm ? cwSendToUser(data.dm, td) : cwBroadcast(td, ws);
          break;
        }

        case 'stop_typing': {
          if (!currentUsername) return;
          const sd = { type: 'stop_typing', username: currentUsername, channel: data.channel || null, dm: data.dm || null };
          data.dm ? cwSendToUser(data.dm, sd) : cwBroadcast(sd, ws);
          break;
        }

        case 'reaction': {
          if (!currentUsername) return;
          let targetMsg = null, bt = null;
          if (data.dm) {
            const dmKey = getDMKey(currentUsername, data.dm);
            if (cwDirectMessages[dmKey]) { targetMsg = cwDirectMessages[dmKey].find(m => m.id === data.id); bt = { dm: data.dm }; }
          } else if (data.channel && cwChannels[data.channel]) {
            targetMsg = cwChannels[data.channel].find(m => m.id === data.id); bt = { channel: data.channel };
          }
          if (targetMsg && bt) {
            if (!targetMsg.reactions) targetMsg.reactions = {};
            if (!targetMsg.reactions[data.emoji]) targetMsg.reactions[data.emoji] = [];
            const idx = targetMsg.reactions[data.emoji].indexOf(currentUsername);
            if (idx !== -1) { targetMsg.reactions[data.emoji].splice(idx, 1); if (!targetMsg.reactions[data.emoji].length) delete targetMsg.reactions[data.emoji]; }
            else targetMsg.reactions[data.emoji].push(currentUsername);
            const update = { type: 'reaction', id: data.id, reactions: targetMsg.reactions, ...bt };
            bt.dm ? (cwSendToUser(currentUsername, update), cwSendToUser(bt.dm, update)) : cwBroadcast(update);
          }
          break;
        }
      }
    });

    ws.on('close', () => {
      if (currentUsername && cwUsers[currentUsername]) {
        delete cwUsers[currentUsername];
        const leaveMsg = { id: generateUUID(), type: 'message', channel: 'general', username: 'System', text: `${currentUsername} has left the chat`, system: true, timestamp: Date.now(), color: '#888' };
        cwChannels.general.push(leaveMsg);
        cwBroadcast(leaveMsg);
        cwBroadcast({ type: 'user_left', username: currentUsername });
        cwBroadcastUsers();
        addLog('connection', `${currentUsername} disconnected from ChatWave`);
      }
    });

    ws.on('error', (err) => console.error('ChatWave WS error:', err.message));
    return;
  }

  // ===== thelongafter WEBSOCKET (original) =====
  const id = ++userIdCounter;
  const color = getColor();
  clients.set(ws, { id, username: `Guest_${id}`, color, authenticated: false, tabs: new Set([id]) });
  console.log(`[+] Connection ${id} (Total connections: ${clients.size})`);
  ws.send(JSON.stringify({ type: 'welcome', id, color }));

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    const client = clients.get(ws);
    if (!client) return;

    switch (data.type) {
      case 'join': {
        const newUsername = (data.username || '').trim().slice(0, 30) || `Guest_${id}`;
        const usernameLower = newUsername.toLowerCase();
        let existingSession = null;
        userSessions.forEach((session, wsCheck) => {
          if (session.username.toLowerCase() === usernameLower) existingSession = session;
        });
        if (existingSession && data.authenticated) {
          client.id = existingSession.id; client.username = existingSession.username;
          client.color = existingSession.color; client.authenticated = true;
          userSessions.set(ws, { id: existingSession.id, username: existingSession.username, color: existingSession.color, authenticated: true });
          console.log(`[JOIN] ${client.username} merged tabs`);
        } else {
          client.username = newUsername; client.color = data.color || client.color;
          client.authenticated = data.authenticated || false; client.tabs = new Set([id]);
          userSessions.set(ws, { id: client.id, username: client.username, color: client.color, authenticated: client.authenticated });
          console.log(`[JOIN] ${client.username} (auth: ${client.authenticated})`);
        }
        broadcastAllPV({ type: 'user_joined', id: client.id, username: client.username, color: client.color, authenticated: client.authenticated, users: getUsers(), timestamp: Date.now() });
        break;
      }

      case 'message': {
        const text = (data.text || '').trim().slice(0, 500);
        if (!text) return;
        if (text.startsWith('/pm ') || text.startsWith('/w ')) {
          const parts = text.substring(4).split(':');
          if (parts.length >= 2) {
            const targetUsername = parts[0].trim().toLowerCase();
            const privateMessage = parts.slice(1).join(':').trim();
            let targetClient = null;
            clients.forEach((c, wsClient) => { if (c.username.toLowerCase() === targetUsername) targetClient = { client: c, ws: wsClient }; });
            if (targetClient) {
              targetClient.ws.send(JSON.stringify({ type: 'private_message', from: { id: client.id, username: client.username, color: client.color }, text: privateMessage, timestamp: Date.now() }));
              ws.send(JSON.stringify({ type: 'private_sent', to: targetClient.client.username, text: privateMessage, timestamp: Date.now() }));
            } else {
              ws.send(JSON.stringify({ type: 'error', message: `User "${parts[0]}" not found or offline` }));
            }
            return;
          }
        }
        if (text.startsWith('/delete ')) {
          const msgId = text.substring(8).trim();
          const msgIndex = chatHistory.findIndex(m => m.id === msgId && m.fromId === client.id);
          if (msgIndex !== -1) {
            chatHistory.splice(msgIndex, 1); saveChatHistory();
            broadcastAllPV({ type: 'message_deleted', id: msgId, deletedBy: client.username, timestamp: Date.now() });
          }
          return;
        }
        const mentions = text.match(/@(\w+)/g) || [];
        const messageData = { type: 'message', id: client.id, fromId: client.id, username: client.username, color: client.color, text, mentions, authenticated: client.authenticated, timestamp: Date.now() };
        broadcastAllPV(messageData);
        mentions.forEach(mention => {
          const mentionedUser = mention.substring(1).toLowerCase();
          clients.forEach((c, wsClient) => {
            if (c.username.toLowerCase() === mentionedUser && c.id !== client.id) {
              wsClient.send(JSON.stringify({ type: 'mention', from: { id: client.id, username: client.username, color: client.color }, text, timestamp: Date.now() }));
            }
          });
        });
        addToHistory({ id: client.id, fromId: client.id, username: client.username, color: client.color, text, mentions, authenticated: client.authenticated });
        break;
      }

      case 'typing':
        broadcastPV({ type: 'typing', id: client.id, username: client.username, isTyping: data.isTyping }, ws);
        break;

      case 'private_message': {
        const pmRecipient = (data.to || '').trim();
        const pmText = (data.text || '').trim().slice(0, 500);
        if (!pmRecipient || !pmText) return;
        if (pmRecipient.toLowerCase() === client.username.toLowerCase()) { ws.send(JSON.stringify({ type: 'error', message: "You can't message yourself" })); return; }
        let targetWs = null, targetClient = null;
        clients.forEach((c, wsClient) => { if (c.username.toLowerCase() === pmRecipient.toLowerCase()) { targetWs = wsClient; targetClient = c; } });
        if (targetWs) {
          targetWs.send(JSON.stringify({ type: 'private_message', from: { id: client.id, username: client.username, color: client.color }, text: pmText, timestamp: Date.now() }));
          ws.send(JSON.stringify({ type: 'private_sent', to: pmRecipient, text: pmText, timestamp: Date.now() }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: `User "${pmRecipient}" is not online` }));
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      console.log(`[-] ${client.username} left (Total: ${clients.size - 1})`);
      userSessions.delete(ws);
      clients.delete(ws);
      broadcastAllPV({ type: 'user_left', id: client.id, username: client.username, users: getUsers(), timestamp: Date.now() });
    }
  });

  ws.on('error', (err) => console.error('[WS Error]', err.message));
});

wss.on('error', (err) => console.error('[WSS Error]', err.message));

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 TheLongAfter + ChatWave Server');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`✅ HTTP Server: Ready`);
  console.log(`✅ WebSocket Server: Ready`);
  console.log(`✅ Auth System: Ready`);
  console.log(`✅ Users: ${Object.keys(users).length} registered`);
  console.log('='.repeat(50));
  console.log('📌 Routes:');
  console.log(`   TheLongAfter: https://thelongafter.onrender.com`);
  console.log(`   ChatWave: https://thelongafter.onrender.com/chat`);
  console.log(`   Admin:    https://thelongafter.onrender.com/admin`);
  console.log(`   Test:     https://thelongafter.onrender.com/test`);
  console.log('='.repeat(50));
});

server.on('error', (err) => { console.error('❌ Server Error:', err.message); process.exit(1); });