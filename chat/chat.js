require('dotenv').config();
const http = require('http');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt'); // Better than crypto for passwords
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// =====================================================
// CONFIGURATION & STATE
// =====================================================
const ADMIN_CONFIG = {
    username: process.env.ADMIN_USER || 'admin',
    // Use a hashed version of 'ChatWaveAdmin2024!'
    passwordHash: process.env.ADMIN_HASH || '$2b$10$YourHashedPasswordHere', 
    sessionExpiry: 24 * 60 * 60 * 1000,
    maxLoginAttempts: 5,
};

// Application State (In-memory - resets on restart)
const state = {
    users: new Map(),           // username -> { ws, color, ip }
    channels: { general: [], random: [], tech: [] },
    directMessages: new Map(),  // key -> [messages]
    adminSessions: new Map(),   // token -> { createdAt, ip }
    bannedIPs: new Set(),
    suspendedUsers: new Map(),  // username -> { until, reason }
    mutedUsers: new Map(),
    userStats: new Map(),
    serverLogs: [],
    slowModeTimers: new Map()
};

let serverSettings = {
    maxMessageLength: 2000,
    slowMode: 0,
    registrationOpen: true,
    maintenanceMode: false,
    wordFilter: [],
    maxHistory: 200
};

// =====================================================
// MIDDLEWARE
// =====================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

// Prevent Chrome DevTools 404 noise
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.json({});
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many login attempts. Try again later." }
});

function authenticateAdmin(req, res, next) {
    const token = req.headers['x-admin-token'];
    const session = state.adminSessions.get(token);
    
    if (!token || !session) return res.status(401).json({ error: 'Unauthorized' });
    if (Date.now() - session.createdAt > ADMIN_CONFIG.sessionExpiry) {
        state.adminSessions.delete(token);
        return res.status(401).json({ error: 'Expired' });
    }
    next();
}

// =====================================================
// ADMIN REST API
// =====================================================

app.post('/admin/api/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip;

    if (state.bannedIPs.has(ip)) return res.status(403).json({ error: 'Banned' });

    const match = username === ADMIN_CONFIG.username && 
                  await bcrypt.compare(password || '', ADMIN_CONFIG.passwordHash);

    if (match) {
        const token = uuidv4(); // Use UUID for session tokens
        state.adminSessions.set(token, { createdAt: Date.now(), ip });
        addLog('auth', `Admin logged in from ${ip}`);
        return res.json({ token });
    }

    addLog('security', `Failed login attempt from ${ip}`);
    res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/admin/api/stats', authenticateAdmin, (req, res) => {
    res.json({
        onlineUsers: state.users.size,
        uptime: process.uptime(),
        memory: process.memoryUsage().heapUsed,
        settings: serverSettings
    });
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function addLog(type, message, details = null) {
    const log = { id: uuidv4(), timestamp: Date.now(), type, message, details };
    state.serverLogs.push(log);
    if (state.serverLogs.length > 500) state.serverLogs.shift();
    broadcastToAdmins({ type: 'log', log });
}

function broadcast(data, excludeWs = null) {
    const payload = JSON.stringify(data);
    state.users.forEach((user) => {
        if (user.ws.readyState === WebSocket.OPEN && user.ws !== excludeWs) {
            user.ws.send(payload);
        }
    });
}

function broadcastToAdmins(data) {
    const payload = JSON.stringify(data);
    state.users.forEach((user) => {
        if (user.isAdmin && user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(payload);
        }
    });
}

const filterText = (text) => {
    let filtered = text;
    serverSettings.wordFilter.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filtered = filtered.replace(regex, '***');
    });
    return filtered;
};

function getDMKey(u1, u2) {
    return `dm:${[u1, u2].sort().join(':')}`;
}

// =====================================================
// WEBSOCKET LOGIC
// =====================================================
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    let currentUsername = null;
    const clientIP = req.socket.remoteAddress;

    function sendUsersList() {
        const usersObj = {};
        state.users.forEach((u, name) => {
            usersObj[name] = { color: u.color };
        });
        broadcast({ type: 'users', users: usersObj });
    }

    function sendToUser(username, data) {
        const user = state.users.get(username);
        if (user && user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(JSON.stringify(data));
        }
    }

    ws.on('message', async (rawData) => {
        let data;
        try { 
            data = JSON.parse(rawData); 
            // Basic size check for incoming JSON
            if (rawData.length > 10000) throw new Error("Payload too large");
        } catch (e) { return; }

        switch (data.type) {
            case 'join':
                handleJoin(ws, data, clientIP);
                break;
            
            case 'message':
                handleMessage(ws, data);
                break;

            case 'typing':
                if (currentUsername) broadcast({ type: 'typing', username: currentUsername, channel: data.channel, dm: data.dm }, ws);
                break;

            case 'stop_typing':
                if (currentUsername) broadcast({ type: 'stop_typing', username: currentUsername, channel: data.channel, dm: data.dm }, ws);
                break;

            case 'get_history':
                handleGetHistory(ws, data);
                break;

            case 'get_dm_history':
                handleGetDMHistory(ws, data);
                break;

            case 'dm':
                handleDM(ws, data);
                break;

            case 'edit':
                handleEdit(ws, data);
                break;

            case 'delete':
                handleDelete(ws, data);
                break;

            case 'reaction':
                handleReaction(ws, data);
                break;

            case 'create_channel':
                handleCreateChannel(ws, data);
                break;
        }
    });

    const handleJoin = (ws, data, ip) => {
        const username = data.username?.trim();
        
        if (!username || username.length > 20 || state.users.has(username)) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Username invalid or taken' }));
        }

        if (state.suspendedUsers.has(username)) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Account suspended' }));
        }

        currentUsername = username;
        state.users.set(username, { ws, color: data.color || '#6C63FF', ip });
        
        ws.send(JSON.stringify({ 
            type: 'history', 
            messages: state.channels.general.slice(-50) 
        }));

        sendUsersList();
        broadcast({ type: 'user_joined', username });
        addLog('connection', `${username} joined`);
    };

    const handleMessage = (ws, data) => {
        if (!currentUsername || state.mutedUsers.has(currentUsername)) return;

        // Slow Mode Check
        const lastMsg = state.slowModeTimers.get(currentUsername) || 0;
        if (Date.now() - lastMsg < serverSettings.slowMode * 1000) return;

        const cleanText = filterText(data.text || '');
        if (!cleanText && !data.file) return;

        const msg = {
            id: uuidv4(),
            type: 'message',
            channel: data.channel || 'general',
            username: currentUsername,
            text: cleanText.substring(0, serverSettings.maxMessageLength),
            timestamp: Date.now(),
            color: state.users.get(currentUsername).color,
            replyTo: data.replyTo || null,
            replyText: data.replyText || null,
            replyUser: data.replyUser || null,
            file: data.file || null
        };

        // Save to channel
        if (!state.channels[msg.channel]) state.channels[msg.channel] = [];
        state.channels[msg.channel].push(msg);
        if (state.channels[msg.channel].length > serverSettings.maxHistory) state.channels[msg.channel].shift();

        state.slowModeTimers.set(currentUsername, Date.now());
        broadcast(msg);
    };

    const handleGetHistory = (ws, data) => {
        const channel = data.channel || 'general';
        const messages = state.channels[channel] ? state.channels[channel].slice(-serverSettings.maxHistory) : [];
        ws.send(JSON.stringify({ type: 'history', channel, messages }));
    };

    const handleGetDMHistory = (ws, data) => {
        const otherUser = data.user;
        if (!otherUser || !currentUsername) return;
        const dmKey = getDMKey(currentUsername, otherUser);
        const messages = state.directMessages.get(dmKey) || [];
        ws.send(JSON.stringify({ type: 'history', dm: otherUser, messages }));
    };

    const handleDM = (ws, data) => {
        if (!currentUsername || state.mutedUsers.has(currentUsername)) return;

        const to = data.to;
        if (!to || to === currentUsername) return;

        const cleanText = filterText(data.text || '');
        if (!cleanText && !data.file) return;

        const msg = {
            id: uuidv4(),
            type: 'dm',
            from: currentUsername,
            to: to,
            text: cleanText.substring(0, serverSettings.maxMessageLength),
            timestamp: Date.now(),
            color: state.users.get(currentUsername)?.color || '#6C63FF',
            replyTo: data.replyTo || null,
            replyText: data.replyText || null,
            replyUser: data.replyUser || null,
            file: data.file || null
        };

        const dmKey = getDMKey(currentUsername, to);
        if (!state.directMessages.has(dmKey)) state.directMessages.set(dmKey, []);
        state.directMessages.get(dmKey).push(msg);
        if (state.directMessages.get(dmKey).length > serverSettings.maxHistory) {
            state.directMessages.get(dmKey).shift();
        }

        sendToUser(currentUsername, msg);
        sendToUser(to, msg);
    };

    const handleEdit = (ws, data) => {
        if (!currentUsername) return;
        const cleanText = filterText(data.text || '');
        if (!cleanText) return;

        if (data.dm) {
            const dmKey = getDMKey(currentUsername, data.dm);
            const msgs = state.directMessages.get(dmKey);
            if (msgs) {
                const msg = msgs.find(m => m.id === data.id && m.from === currentUsername);
                if (msg) {
                    msg.text = cleanText.substring(0, serverSettings.maxMessageLength);
                    msg.edited = true;
                    sendToUser(currentUsername, { type: 'edit', id: data.id, text: msg.text, dm: data.dm });
                    sendToUser(data.dm, { type: 'edit', id: data.id, text: msg.text, dm: data.dm });
                }
            }
        } else {
            const channel = data.channel || 'general';
            const msgs = state.channels[channel];
            if (msgs) {
                const msg = msgs.find(m => m.id === data.id && m.username === currentUsername);
                if (msg) {
                    msg.text = cleanText.substring(0, serverSettings.maxMessageLength);
                    msg.edited = true;
                    broadcast({ type: 'edit', id: data.id, text: msg.text, channel });
                }
            }
        }
    };

    const handleDelete = (ws, data) => {
        if (!currentUsername) return;

        if (data.dm) {
            const dmKey = getDMKey(currentUsername, data.dm);
            const msgs = state.directMessages.get(dmKey);
            if (msgs) {
                const idx = msgs.findIndex(m => m.id === data.id && m.from === currentUsername);
                if (idx !== -1) {
                    msgs.splice(idx, 1);
                    sendToUser(currentUsername, { type: 'delete', id: data.id, dm: data.dm });
                    sendToUser(data.dm, { type: 'delete', id: data.id, dm: data.dm });
                }
            }
        } else {
            const channel = data.channel || 'general';
            const msgs = state.channels[channel];
            if (msgs) {
                const idx = msgs.findIndex(m => m.id === data.id && m.username === currentUsername);
                if (idx !== -1) {
                    msgs.splice(idx, 1);
                    broadcast({ type: 'delete', id: data.id, channel });
                }
            }
        }
    };

    const handleReaction = (ws, data) => {
        if (!currentUsername) return;

        const updateReactions = (msg) => {
            if (!msg.reactions) msg.reactions = {};
            if (!msg.reactions[data.emoji]) msg.reactions[data.emoji] = [];
            const reactors = msg.reactions[data.emoji];
            const idx = reactors.indexOf(currentUsername);
            if (idx === -1) {
                reactors.push(currentUsername);
            } else {
                reactors.splice(idx, 1);
                if (reactors.length === 0) delete msg.reactions[data.emoji];
            }
            return msg.reactions;
        };

        if (data.dm) {
            const dmKey = getDMKey(currentUsername, data.dm);
            const msgs = state.directMessages.get(dmKey);
            if (msgs) {
                const msg = msgs.find(m => m.id === data.id);
                if (msg) {
                    const reactions = updateReactions(msg);
                    sendToUser(currentUsername, { type: 'reaction', id: data.id, reactions, dm: data.dm });
                    sendToUser(data.dm, { type: 'reaction', id: data.id, reactions, dm: data.dm });
                }
            }
        } else {
            const channel = data.channel || 'general';
            const msgs = state.channels[channel];
            if (msgs) {
                const msg = msgs.find(m => m.id === data.id);
                if (msg) {
                    const reactions = updateReactions(msg);
                    broadcast({ type: 'reaction', id: data.id, reactions, channel });
                }
            }
        }
    };

    const handleCreateChannel = (ws, data) => {
        if (!currentUsername) return;
        const channel = data.channel?.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
        if (!channel || state.channels[channel]) return;
        state.channels[channel] = [];
        broadcast({ type: 'channel_created', channel });
        addLog('channel', `${currentUsername} created #${channel}`);
    };

    ws.on('close', () => {
        if (currentUsername) {
            state.users.delete(currentUsername);
            sendUsersList();
            broadcast({ type: 'user_left', username: currentUsername });
            addLog('connection', `${currentUsername} left`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

