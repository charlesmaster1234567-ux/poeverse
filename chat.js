const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// ADMIN CONFIGURATION
// =====================================================
const ADMIN_CONFIG = {
  username: 'admin',
  passwordHash: crypto.createHash('sha256').update('ChatWaveAdmin2024!').digest('hex'),
  sessionExpiry: 24 * 60 * 60 * 1000,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000
};

// ---- State ----
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

// ---- In-Memory Data ----
const users = {};
const channels = { general: [], random: [], tech: [] };
const directMessages = {};

// ---- Express Setup ----
app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '10mb' }));

// ---- Helper Functions ----
function addLog(type, message, details = null) {
  const log = { id: uuidv4(), timestamp: Date.now(), type, message, details };
  serverLogs.push(log);
  if (serverLogs.length > 1000) serverLogs.splice(0, serverLogs.length - 1000);
  broadcastToAdmins({ type: 'log', log });
}

function broadcastToAdmins(data) {
  const msg = JSON.stringify(data);
  adminWsClients.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}

function broadcast(data, excludeWs = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client !== excludeWs && !client.__isAdmin) {
      client.send(msg);
    }
  });
}

function sendToUser(username, data) {
  const user = users[username];
  if (user && user.ws && user.ws.readyState === 1) {
    user.ws.send(JSON.stringify(data));
  }
}

function getDMKey(user1, user2) { return [user1, user2].sort().join(':'); }

function broadcastUsers() {
  const userList = {};
  for (const [name, data] of Object.entries(users)) userList[name] = { color: data.color };
  broadcast({ type: 'users', users: userList });
  broadcastToAdmins({ type: 'users_update', users: userList, count: Object.keys(userList).length });
}

function broadcastSystemMessage(text, channel = 'general') {
  const msg = {
    id: uuidv4(), type: 'message', channel,
    username: 'System', text, system: true,
    timestamp: Date.now(), color: '#888'
  };
  if (channels[channel]) channels[channel].push(msg);
  broadcast(msg);
}

function checkWordFilter(text) {
  if (!serverSettings.wordFilter || serverSettings.wordFilter.length === 0) return text;
  let filtered = text;
  serverSettings.wordFilter.forEach(word => {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
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

// ---- Routes ----
app.get('/', (req, res) => {
  if (serverSettings.maintenanceMode) {
    return res.send(`<!DOCTYPE html><html><head><title>Maintenance</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0;font-family:system-ui;text-align:center">
      <div><h1>🔧</h1><h2>Under Maintenance</h2><p>Please check back later.</p></div></body></html>`);
  }
  res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ---- Admin Auth Middleware ----
function authenticateAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || !adminSessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  const session = adminSessions.get(token);
  if (Date.now() - session.createdAt > ADMIN_CONFIG.sessionExpiry) {
    adminSessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  next();
}

// ---- Admin API Routes ----
app.post('/admin/api/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (bannedIPs.has(ip)) return res.status(403).json({ error: 'IP banned' });
  const attempts = loginAttempts.get(ip);
  if (attempts && attempts.count >= ADMIN_CONFIG.maxLoginAttempts) {
    const timeSince = Date.now() - attempts.lastAttempt;
    if (timeSince < ADMIN_CONFIG.lockoutDuration) {
      const remaining = Math.ceil((ADMIN_CONFIG.lockoutDuration - timeSince) / 60000);
      return res.status(429).json({ error: `Too many attempts. Try again in ${remaining} minutes.` });
    }
    loginAttempts.delete(ip);
  }
  const { username, password } = req.body;
  const hash = crypto.createHash('sha256').update(password || '').digest('hex');
  if (username === ADMIN_CONFIG.username && hash === ADMIN_CONFIG.passwordHash) {
    const token = crypto.randomBytes(48).toString('hex');
    adminSessions.set(token, { createdAt: Date.now(), ip });
    loginAttempts.delete(ip);
    addLog('auth', `Admin logged in from ${ip}`);
    return res.json({ token, expiresIn: ADMIN_CONFIG.sessionExpiry });
  }
  const current = loginAttempts.get(ip) || { count: 0 };
  current.count++;
  current.lastAttempt = Date.now();
  loginAttempts.set(ip, current);
  res.status(401).json({ error: 'Invalid credentials', attemptsRemaining: ADMIN_CONFIG.maxLoginAttempts - current.count });
});

app.post('/admin/api/logout', authenticateAdmin, (req, res) => {
  adminSessions.delete(req.headers['x-admin-token']);
  addLog('auth', 'Admin logged out');
  res.json({ success: true });
});

app.get('/admin/api/verify', authenticateAdmin, (req, res) => res.json({ valid: true }));

app.get('/admin/api/stats', authenticateAdmin, (req, res) => {
  const totalMessages =
    Object.values(channels).reduce((sum, msgs) => sum + msgs.length, 0) +
    Object.values(directMessages).reduce((sum, msgs) => sum + msgs.length, 0);
  res.json({
    onlineUsers: Object.keys(users).length, totalMessages,
    totalChannels: Object.keys(channels).length,
    suspendedCount: suspendedUsers.size, mutedCount: mutedUsers.size,
    uptime: process.uptime(), memoryUsage: process.memoryUsage(), serverSettings
  });
});

app.get('/admin/api/users', authenticateAdmin, (req, res) => {
  const allUsers = {};
  for (const [name, data] of Object.entries(users)) {
    allUsers[name] = {
      username: name, color: data.color, online: true,
      ip: ipAddressMap.get(name) || 'Unknown',
      suspended: suspendedUsers.get(name) || null,
      muted: mutedUsers.get(name) || null,
      stats: userStats.get(name) || { messageCount: 0 },
      warnings: userWarnings.get(name) || []
    };
  }
  for (const [name, stats] of userStats.entries()) {
    if (!allUsers[name]) {
      allUsers[name] = {
        username: name, color: '#888', online: false,
        ip: ipAddressMap.get(name) || 'Unknown',
        suspended: suspendedUsers.get(name) || null,
        muted: mutedUsers.get(name) || null,
        stats, warnings: userWarnings.get(name) || []
      };
    }
  }
  res.json(Object.values(allUsers));
});

app.post('/admin/api/users/:username/kick', authenticateAdmin, (req, res) => {
  const { username } = req.params;
  const reason = req.body.reason || 'Kicked by admin';
  if (!users[username]) return res.status(404).json({ error: 'User not online' });
  sendToUser(username, { type: 'admin_action', action: 'kick', reason, message: `You have been kicked: ${reason}` });
  setTimeout(() => { if (users[username]?.ws) users[username].ws.close(1000, 'Kicked by admin'); }, 500);
  addLog('moderation', `Kicked user: ${username}`, { reason });
  broadcastSystemMessage(`${username} has been removed from the chat.`);
  res.json({ success: true });
});

app.post('/admin/api/users/:username/suspend', authenticateAdmin, (req, res) => {
  const { username } = req.params;
  const { duration, reason } = req.body;
  const until = duration ? Date.now() + duration * 60000 : null;
  suspendedUsers.set(username, { until, reason: reason || 'Suspended by admin', suspendedAt: Date.now() });
  if (users[username]) {
    sendToUser(username, { type: 'admin_action', action: 'suspend', reason, until, message: `You have been suspended${duration ? ` for ${duration} minutes` : ' permanently'}: ${reason || 'No reason provided'}` });
    setTimeout(() => { if (users[username]?.ws) users[username].ws.close(1000, 'Suspended'); }, 500);
  }
  addLog('moderation', `Suspended user: ${username}`, { duration, reason, until });
  res.json({ success: true });
});

app.post('/admin/api/users/:username/unsuspend', authenticateAdmin, (req, res) => {
  suspendedUsers.delete(req.params.username);
  addLog('moderation', `Unsuspended user: ${req.params.username}`);
  res.json({ success: true });
});

app.post('/admin/api/users/:username/mute', authenticateAdmin, (req, res) => {
  const { username } = req.params;
  const { duration, reason } = req.body;
  const until = duration ? Date.now() + duration * 60000 : null;
  mutedUsers.set(username, { until, reason: reason || 'Muted by admin', mutedAt: Date.now() });
  if (users[username]) sendToUser(username, { type: 'admin_action', action: 'mute', reason, until, message: `You have been muted${duration ? ` for ${duration} minutes` : ' permanently'}: ${reason || 'No reason provided'}` });
  addLog('moderation', `Muted user: ${username}`, { duration, reason });
  res.json({ success: true });
});

app.post('/admin/api/users/:username/unmute', authenticateAdmin, (req, res) => {
  const { username } = req.params;
  mutedUsers.delete(username);
  if (users[username]) sendToUser(username, { type: 'admin_action', action: 'unmute', message: 'You have been unmuted.' });
  addLog('moderation', `Unmuted user: ${username}`);
  res.json({ success: true });
});

app.post('/admin/api/users/:username/warn', authenticateAdmin, (req, res) => {
  const { username } = req.params;
  const { reason } = req.body;
  if (!userWarnings.has(username)) userWarnings.set(username, []);
  userWarnings.get(username).push({ reason: reason || 'Warning from admin', timestamp: Date.now(), by: 'admin' });
  if (users[username]) sendToUser(username, { type: 'admin_action', action: 'warn', reason, message: `⚠️ Warning: ${reason || 'Please follow the rules.'}` });
  addLog('moderation', `Warned user: ${username}`, { reason });
  res.json({ success: true, totalWarnings: userWarnings.get(username).length });
});

app.post('/admin/api/users/:username/ban-ip', authenticateAdmin, (req, res) => {
  const { username } = req.params;
  const { reason } = req.body;
  const ip = ipAddressMap.get(username);
  if (ip) { bannedIPs.add(ip); addLog('moderation', `Banned IP for user: ${username}`, { ip, reason }); }
  suspendedUsers.set(username, { until: null, reason: reason || 'IP Banned', suspendedAt: Date.now() });
  if (users[username]) {
    sendToUser(username, { type: 'admin_action', action: 'ban', message: `You have been permanently banned: ${reason || 'No reason provided'}` });
    setTimeout(() => { if (users[username]?.ws) users[username].ws.close(1000, 'Banned'); }, 500);
  }
  res.json({ success: true, ip });
});

app.post('/admin/api/users/:username/purge', authenticateAdmin, (req, res) => {
  const { username } = req.params;
  let purged = 0;
  for (const [ch, msgs] of Object.entries(channels)) {
    const toDelete = msgs.filter(m => m.username === username).map(m => m.id);
    channels[ch] = msgs.filter(m => m.username !== username);
    purged += toDelete.length;
    toDelete.forEach(id => broadcast({ type: 'delete', id, channel: ch }));
  }
  for (const [key, msgs] of Object.entries(directMessages)) {
    const toDelete = msgs.filter(m => m.from === username).map(m => m.id);
    directMessages[key] = msgs.filter(m => m.from !== username);
    purged += toDelete.length;
    const parts = key.split(':');
    toDelete.forEach(id => parts.forEach(u => sendToUser(u, { type: 'delete', id, dm: parts.find(p => p !== u) || u })));
  }
  addLog('moderation', `Purged ${purged} messages from ${username}`);
  res.json({ success: true, purged });
});

app.get('/admin/api/messages/:channel', authenticateAdmin, (req, res) => {
  res.json((channels[req.params.channel] || []).slice(-200));
});

app.get('/admin/api/dms', authenticateAdmin, (req, res) => {
  const summary = {};
  for (const [key, msgs] of Object.entries(directMessages)) {
    summary[key] = { participants: key.split(':'), messageCount: msgs.length, lastMessage: msgs[msgs.length - 1] || null };
  }
  res.json(summary);
});

app.get('/admin/api/dms/:key', authenticateAdmin, (req, res) => {
  res.json((directMessages[req.params.key] || []).slice(-200));
});

app.delete('/admin/api/messages/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { channel, dmKey } = req.query;
  let found = false;
  if (dmKey && directMessages[dmKey]) {
    const idx = directMessages[dmKey].findIndex(m => m.id === id);
    if (idx !== -1) {
      const deleted = directMessages[dmKey].splice(idx, 1)[0];
      const parts = dmKey.split(':');
      parts.forEach(u => sendToUser(u, { type: 'delete', id, dm: parts.find(p => p !== u) || u }));
      found = true;
      addLog('moderation', 'Deleted DM message', { id, from: deleted.from });
    }
  } else {
    for (const ch of (channel ? [channel] : Object.keys(channels))) {
      if (!channels[ch]) continue;
      const idx = channels[ch].findIndex(m => m.id === id);
      if (idx !== -1) {
        const deleted = channels[ch].splice(idx, 1)[0];
        broadcast({ type: 'delete', id, channel: ch });
        found = true;
        addLog('moderation', `Deleted message in #${ch}`, { id, user: deleted.username });
        break;
      }
    }
  }
  if (!found) return res.status(404).json({ error: 'Message not found' });
  res.json({ success: true });
});

app.post('/admin/api/channels/:channel/clear', authenticateAdmin, (req, res) => {
  const { channel } = req.params;
  if (!channels[channel]) return res.status(404).json({ error: 'Channel not found' });
  const ids = channels[channel].map(m => m.id);
  channels[channel] = [];
  ids.forEach(id => broadcast({ type: 'delete', id, channel }));
  broadcastSystemMessage(`Channel #${channel} has been cleared by an administrator.`, channel);
  addLog('moderation', `Cleared channel #${channel}`, { messagesRemoved: ids.length });
  res.json({ success: true, cleared: ids.length });
});

app.delete('/admin/api/channels/:channel', authenticateAdmin, (req, res) => {
  const { channel } = req.params;
  if (channel === 'general') return res.status(400).json({ error: 'Cannot delete the general channel' });
  if (!channels[channel]) return res.status(404).json({ error: 'Channel not found' });
  delete channels[channel];
  broadcast({ type: 'channel_deleted', channel });
  addLog('moderation', `Deleted channel #${channel}`);
  res.json({ success: true });
});

app.get('/admin/api/channels', authenticateAdmin, (req, res) => {
  const chList = {};
  for (const [name, msgs] of Object.entries(channels)) {
    chList[name] = { name, messageCount: msgs.length, lastActivity: msgs[msgs.length - 1]?.timestamp || null };
  }
  res.json(chList);
});

app.post('/admin/api/channels', authenticateAdmin, (req, res) => {
  const clean = (req.body.name || '').toLowerCase().replace(/[^a-z0-9\-_]/g, '');
  if (!clean || channels[clean]) return res.status(400).json({ error: 'Invalid or existing channel name' });
  channels[clean] = [];
  broadcast({ type: 'channel_created', channel: clean });
  addLog('admin', `Created channel #${clean}`);
  res.json({ success: true, channel: clean });
});

app.post('/admin/api/announce', authenticateAdmin, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  announcements.push({ id: uuidv4(), text, timestamp: Date.now() });
  broadcast({ type: 'announcement', text, timestamp: Date.now() });
  broadcastSystemMessage(`📢 Announcement: ${text}`);
  addLog('admin', `Broadcast announcement: ${text}`);
  res.json({ success: true });
});

app.get('/admin/api/settings', authenticateAdmin, (req, res) => res.json(serverSettings));

app.put('/admin/api/settings', authenticateAdmin, (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    if (key in serverSettings) serverSettings[key] = value;
  }
  addLog('admin', 'Updated server settings', req.body);
  res.json(serverSettings);
});

app.get('/admin/api/logs', authenticateAdmin, (req, res) => {
  let logs = serverLogs;
  if (req.query.type) logs = logs.filter(l => l.type === req.query.type);
  res.json(logs.slice(-(parseInt(req.query.limit) || 100)));
});

app.delete('/admin/api/logs', authenticateAdmin, (req, res) => {
  serverLogs.length = 0;
  res.json({ success: true });
});

app.get('/admin/api/banned-ips', authenticateAdmin, (req, res) => res.json(Array.from(bannedIPs)));

app.delete('/admin/api/banned-ips/:ip', authenticateAdmin, (req, res) => {
  bannedIPs.delete(req.params.ip);
  addLog('admin', `Unbanned IP: ${req.params.ip}`);
  res.json({ success: true });
});

// ---- HTTP + WebSocket Server ----
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ---- WebSocket Handler ----
wss.on('connection', (ws, req) => {
  let currentUsername = null;
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const adminToken = url.searchParams.get('admin_token');

  if (adminToken && adminSessions.has(adminToken)) {
    ws.__isAdmin = true;
    adminWsClients.add(ws);
    ws.on('close', () => adminWsClients.delete(ws));
    ws.send(JSON.stringify({ type: 'admin_connected' }));
    return;
  }

  if (bannedIPs.has(clientIP)) {
    ws.send(JSON.stringify({ type: 'error', message: 'You have been banned from this server.' }));
    ws.close(1000, 'Banned');
    return;
  }

  ws.on('message', (rawData) => {
    let data;
    try { data = JSON.parse(rawData.toString()); } catch { return; }

    switch (data.type) {

      case 'join': {
        const username = (data.username || '').trim();
        if (!username || username.length > 20) return ws.send(JSON.stringify({ type: 'error', message: 'Invalid username' }));
        if (serverSettings.maintenanceMode) return ws.send(JSON.stringify({ type: 'error', message: 'Server is under maintenance.' }));
        if (!serverSettings.registrationOpen && !userStats.has(username)) return ws.send(JSON.stringify({ type: 'error', message: 'Registration is currently closed.' }));
        if (isUserSuspended(username)) {
          const s = suspendedUsers.get(username);
          const timeLeft = s.until ? Math.ceil((s.until - Date.now()) / 60000) : 'permanently';
          return ws.send(JSON.stringify({ type: 'error', message: `You are suspended${typeof timeLeft === 'number' ? ` for ${timeLeft} more minutes` : ' permanently'}: ${s.reason}` }));
        }
        if (users[username]) return ws.send(JSON.stringify({ type: 'error', message: 'Username already taken' }));
        if (['admin', 'system', 'moderator', 'server'].includes(username.toLowerCase())) return ws.send(JSON.stringify({ type: 'error', message: 'That username is reserved' }));

        currentUsername = username;
        users[username] = { ws, color: data.color || '#6C63FF' };
        ipAddressMap.set(username, clientIP);
        if (!userStats.has(username)) userStats.set(username, { messageCount: 0, joinedAt: Date.now(), lastActive: Date.now() });
        else userStats.get(username).lastActive = Date.now();

        broadcastUsers();
        if (serverSettings.welcomeMessage) ws.send(JSON.stringify({ type: 'admin_action', action: 'welcome', message: serverSettings.welcomeMessage }));
        if (isUserMuted(username)) ws.send(JSON.stringify({ type: 'admin_action', action: 'mute_notice', message: `You are currently muted: ${mutedUsers.get(username).reason}` }));
        ws.send(JSON.stringify({ type: 'history', channel: 'general', messages: channels.general.slice(-100) }));
        for (const ch of Object.keys(channels)) {
          if (!['general', 'random', 'tech'].includes(ch)) ws.send(JSON.stringify({ type: 'channel_created', channel: ch }));
        }
        const joinMsg = { id: uuidv4(), type: 'message', channel: 'general', username: 'System', text: `${username} has joined the chat`, system: true, timestamp: Date.now(), color: '#888' };
        channels.general.push(joinMsg);
        broadcast(joinMsg);
        broadcast({ type: 'user_joined', username }, ws);
        addLog('connection', `${username} joined from ${clientIP}`);
        break;
      }

      case 'message': {
        if (!currentUsername) return;
        if (isUserMuted(currentUsername)) return ws.send(JSON.stringify({ type: 'error', message: 'You are muted and cannot send messages.' }));
        if (serverSettings.slowMode > 0) {
          const last = slowModeTimers.get(currentUsername);
          if (last && Date.now() - last < serverSettings.slowMode * 1000) {
            const wait = Math.ceil((serverSettings.slowMode * 1000 - (Date.now() - last)) / 1000);
            return ws.send(JSON.stringify({ type: 'error', message: `Slow mode: wait ${wait}s before sending another message.` }));
          }
        }
        if (data.text && data.text.length > serverSettings.maxMessageLength) return ws.send(JSON.stringify({ type: 'error', message: `Message too long. Max ${serverSettings.maxMessageLength} characters.` }));

        const channel = data.channel || 'general';
        if (!channels[channel]) channels[channel] = [];
        const msg = {
          id: uuidv4(), type: 'message', channel, username: currentUsername,
          text: checkWordFilter(data.text || ''), file: data.file || null,
          replyTo: data.replyTo || null, replyText: data.replyText || null, replyUser: data.replyUser || null,
          reactions: {}, edited: false, timestamp: Date.now(), color: users[currentUsername].color
        };
        channels[channel].push(msg);
        if (channels[channel].length > 500) channels[channel] = channels[channel].slice(-500);
        slowModeTimers.set(currentUsername, Date.now());
        const stats = userStats.get(currentUsername);
        if (stats) { stats.messageCount++; stats.lastActive = Date.now(); }
        broadcast(msg);
        broadcastToAdmins({ type: 'new_message', message: msg });
        break;
      }

      case 'dm': {
        if (!currentUsername) return;
        if (isUserMuted(currentUsername)) return ws.send(JSON.stringify({ type: 'error', message: 'You are muted and cannot send messages.' }));
        if (!data.to || !users[data.to]) return ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
        const dmKey = getDMKey(currentUsername, data.to);
        if (!directMessages[dmKey]) directMessages[dmKey] = [];
        const msg = {
          id: uuidv4(), type: 'dm', from: currentUsername, to: data.to,
          text: checkWordFilter(data.text || ''), file: data.file || null,
          replyTo: data.replyTo || null, replyText: data.replyText || null, replyUser: data.replyUser || null,
          reactions: {}, edited: false, timestamp: Date.now(), color: users[currentUsername].color
        };
        directMessages[dmKey].push(msg);
        if (directMessages[dmKey].length > 500) directMessages[dmKey] = directMessages[dmKey].slice(-500);
        sendToUser(currentUsername, msg);
        sendToUser(data.to, msg);
        const stats = userStats.get(currentUsername);
        if (stats) { stats.messageCount++; stats.lastActive = Date.now(); }
        broadcastToAdmins({ type: 'new_dm', message: msg });
        break;
      }

      case 'get_history': {
        if (!currentUsername) return;
        const ch = data.channel || 'general';
        if (!channels[ch]) channels[ch] = [];
        ws.send(JSON.stringify({ type: 'history', channel: ch, messages: channels[ch].slice(-100) }));
        break;
      }

      case 'get_dm_history': {
        if (!currentUsername) return;
        const dmKey = getDMKey(currentUsername, data.user);
        if (!directMessages[dmKey]) directMessages[dmKey] = [];
        ws.send(JSON.stringify({ type: 'history', dm: data.user, messages: directMessages[dmKey].slice(-100) }));
        break;
      }

      case 'create_channel': {
        if (!currentUsername) return;
        const channelName = (data.channel || '').toLowerCase().replace(/[^a-z0-9\-_]/g, '');
        if (!channelName || channelName.length > 20) return ws.send(JSON.stringify({ type: 'error', message: 'Invalid channel name' }));
        if (channels[channelName]) return ws.send(JSON.stringify({ type: 'error', message: 'Channel already exists' }));
        channels[channelName] = [];
        broadcast({ type: 'channel_created', channel: channelName });
        addLog('channel', `${currentUsername} created channel #${channelName}`);
        break;
      }

      case 'typing': {
        if (!currentUsername) return;
        const td = { type: 'typing', username: currentUsername, channel: data.channel || null, dm: data.dm || null };
        data.dm ? sendToUser(data.dm, td) : broadcast(td, ws);
        break;
      }

      case 'stop_typing': {
        if (!currentUsername) return;
        const sd = { type: 'stop_typing', username: currentUsername, channel: data.channel || null, dm: data.dm || null };
        data.dm ? sendToUser(data.dm, sd) : broadcast(sd, ws);
        break;
      }

      case 'edit': {
        if (!currentUsername) return;
        let found = false;
        if (data.dm) {
          const dmKey = getDMKey(currentUsername, data.dm);
          if (directMessages[dmKey]) {
            const msg = directMessages[dmKey].find(m => m.id === data.id && m.from === currentUsername);
            if (msg) {
              msg.text = checkWordFilter(data.text); msg.edited = true; found = true;
              sendToUser(currentUsername, { type: 'edit', id: data.id, text: msg.text, dm: data.dm });
              sendToUser(data.dm, { type: 'edit', id: data.id, text: msg.text, dm: currentUsername });
            }
          }
        } else if (data.channel && channels[data.channel]) {
          const msg = channels[data.channel].find(m => m.id === data.id && m.username === currentUsername);
          if (msg) { msg.text = checkWordFilter(data.text); msg.edited = true; found = true; broadcast({ type: 'edit', id: data.id, text: msg.text, channel: data.channel }); }
        }
        if (!found) {
          for (const [ch, msgs] of Object.entries(channels)) {
            const msg = msgs.find(m => m.id === data.id && m.username === currentUsername);
            if (msg) { msg.text = checkWordFilter(data.text); msg.edited = true; broadcast({ type: 'edit', id: data.id, text: msg.text, channel: ch }); break; }
          }
        }
        break;
      }

      case 'delete': {
        if (!currentUsername) return;
        if (data.dm) {
          const dmKey = getDMKey(currentUsername, data.dm);
          if (directMessages[dmKey]) {
            const idx = directMessages[dmKey].findIndex(m => m.id === data.id && m.from === currentUsername);
            if (idx !== -1) {
              directMessages[dmKey].splice(idx, 1);
              sendToUser(currentUsername, { type: 'delete', id: data.id, dm: data.dm });
              sendToUser(data.dm, { type: 'delete', id: data.id, dm: currentUsername });
            }
          }
        } else if (data.channel && channels[data.channel]) {
          const idx = channels[data.channel].findIndex(m => m.id === data.id && m.username === currentUsername);
          if (idx !== -1) { channels[data.channel].splice(idx, 1); broadcast({ type: 'delete', id: data.id, channel: data.channel }); }
        } else {
          for (const [ch, msgs] of Object.entries(channels)) {
            const idx = msgs.findIndex(m => m.id === data.id && m.username === currentUsername);
            if (idx !== -1) { msgs.splice(idx, 1); broadcast({ type: 'delete', id: data.id, channel: ch }); break; }
          }
        }
        break;
      }

      case 'reaction': {
        if (!currentUsername) return;
        let targetMsg = null, broadcastTarget = null;
        if (data.dm) {
          const dmKey = getDMKey(currentUsername, data.dm);
          if (directMessages[dmKey]) { targetMsg = directMessages[dmKey].find(m => m.id === data.id); broadcastTarget = { dm: data.dm }; }
        } else if (data.channel && channels[data.channel]) {
          targetMsg = channels[data.channel].find(m => m.id === data.id); broadcastTarget = { channel: data.channel };
        } else {
          for (const [ch, msgs] of Object.entries(channels)) {
            targetMsg = msgs.find(m => m.id === data.id);
            if (targetMsg) { broadcastTarget = { channel: ch }; break; }
          }
        }
        if (targetMsg && broadcastTarget) {
          if (!targetMsg.reactions) targetMsg.reactions = {};
          if (!targetMsg.reactions[data.emoji]) targetMsg.reactions[data.emoji] = [];
          const idx = targetMsg.reactions[data.emoji].indexOf(currentUsername);
          if (idx !== -1) {
            targetMsg.reactions[data.emoji].splice(idx, 1);
            if (targetMsg.reactions[data.emoji].length === 0) delete targetMsg.reactions[data.emoji];
          } else targetMsg.reactions[data.emoji].push(currentUsername);
          const update = { type: 'reaction', id: data.id, reactions: targetMsg.reactions, ...broadcastTarget };
          broadcastTarget.dm ? (sendToUser(currentUsername, update), sendToUser(broadcastTarget.dm, update)) : broadcast(update);
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentUsername && users[currentUsername]) {
      delete users[currentUsername];
      const leaveMsg = { id: uuidv4(), type: 'message', channel: 'general', username: 'System', text: `${currentUsername} has left the chat`, system: true, timestamp: Date.now(), color: '#888' };
      channels.general.push(leaveMsg);
      broadcast(leaveMsg);
      broadcast({ type: 'user_left', username: currentUsername });
      broadcastUsers();
      addLog('connection', `${currentUsername} disconnected`);
    }
  });

  ws.on('error', (err) => console.error('WebSocket error:', err.message));
});

// ---- Start Server ----
server.listen(PORT, () => {
  addLog('system', 'Server started');
  console.log(`
╔══════════════════════════════════════════╗
║          🌊 ChatWave Server 🌊           ║
╠══════════════════════════════════════════╣
║  🚀 Chat:  http://localhost:${PORT}          ║
║  🔐 Admin: http://localhost:${PORT}/admin     ║
╠══════════════════════════════════════════╣
║  Admin Login:                            ║
║  Username: admin                         ║
║  Password: ChatWaveAdmin2024!            ║
╚══════════════════════════════════════════╝
  `);
});