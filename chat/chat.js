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
app.use(helmet({ contentSecurityPolicy: false })); // Basic security headers
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

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

// =====================================================
// WEBSOCKET LOGIC
// =====================================================
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    let currentUsername = null;
    const clientIP = req.socket.remoteAddress;

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
                if (currentUsername) broadcast({ type: 'typing', username: currentUsername, channel: data.channel }, ws);
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
            color: state.users.get(currentUsername).color
        };

        // Save to channel
        if (!state.channels[msg.channel]) state.channels[msg.channel] = [];
        state.channels[msg.channel].push(msg);
        if (state.channels[msg.channel].length > serverSettings.maxHistory) state.channels[msg.channel].shift();

        state.slowModeTimers.set(currentUsername, Date.now());
        broadcast(msg);
    };

    ws.on('close', () => {
        if (currentUsername) {
            state.users.delete(currentUsername);
            broadcast({ type: 'user_left', username: currentUsername });
            addLog('connection', `${currentUsername} left`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});