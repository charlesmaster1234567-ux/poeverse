// =====================================================
// TheLongAfter CLIENT
// =====================================================

let ws = null;
let myUsername = '';
let myColor = '#6C63FF';
let currentChannel = 'general';
let currentDM = null;
let onlineUsers = {};
let typingUsers = {};
let typingTimeout = null;
let isTyping = false;
let replyTo = null;
let selectedFile = null;
let contextTarget = null;
let messageElements = {};
let unreadCounts = {};
let lastMessageDate = '';

const EMOJIS = ['😀','😂','🥹','😍','🥳','🤔','😎','🤩','😢','😡','👍','👎','❤️','🔥','⭐','🎉','💯','🙏','👀','💀','🤝','✅','❌','⚡','🌊','🎶','💬','📌','🚀','💡','☕','🌙','🫡','😤','🥲','😈','💜','🧡','💚','🤍'];

// ---- Helpers ----
function escapeHtml(s) { return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' });
}

function formatText(text) {
  let t = escapeHtml(text);
  // Code blocks
  t = t.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
  // Inline code
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Links
  t = t.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  // Mentions
  t = t.replace(/@(\w+)/g, '<span style="color:var(--accent);font-weight:600;cursor:pointer">@$1</span>');
  return t;
}

function showToast(type, msg) {
  const c = document.getElementById('toastContainer');
  const icons = { error:'❌', success:'✅', info:'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${escapeHtml(msg)}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 4000);
}

function showAnnouncement(text) {
  // Remove existing announcement if any
  const existing = document.getElementById('announcementBanner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'announcementBanner';
  banner.className = 'announcement';
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9998;
    min-width: 400px;
    max-width: 700px;
    width: 90%;
    padding: 16px 20px;
    background: linear-gradient(135deg, rgba(108,99,255,0.15), rgba(139,92,246,0.1));
    border: 1px solid rgba(108,99,255,0.4);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: flex-start;
    gap: 12px;
    animation: annIn 0.4s ease;
  `;

  // Countdown bar
  banner.innerHTML = `
    <style>
      @keyframes annIn {
        from { opacity:0; transform:translateX(-50%) translateY(-20px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
      @keyframes annOut {
        from { opacity:1; transform:translateX(-50%) translateY(0); }
        to   { opacity:0; transform:translateX(-50%) translateY(-20px); }
      }
      @keyframes countdown {
        from { width: 100%; }
        to   { width: 0%; }
      }
      #announcementBanner .ann-progress {
        position: absolute;
        bottom: 0; left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent), var(--accent2));
        border-radius: 0 0 12px 12px;
        animation: countdown 120s linear forwards;
      }
    </style>
    <span style="font-size:24px;flex-shrink:0">📢</span>
    <div style="flex:1">
      <div style="font-weight:700;font-size:13px;color:var(--accent);margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">
        📣 Announcement
      </div>
      <div style="font-size:14px;color:var(--text);line-height:1.5">
        ${escapeHtml(text)}
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:6px">
        ⏱️ Disappears in <span id="annCountdown">2:00</span>
      </div>
    </div>
    <button onclick="document.getElementById('announcementBanner').remove();clearInterval(window._annTimer);clearInterval(window._annCountdown);"
      style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;padding:4px;border-radius:4px;transition:var(--transition);flex-shrink:0"
      onmouseover="this.style.color='var(--danger)'"
      onmouseout="this.style.color='var(--text3)'">✕</button>
    <div class="ann-progress"></div>
  `;

  banner.style.position = 'fixed';
  document.body.appendChild(banner);

  // Countdown timer display
  let seconds = 120;
  window._annCountdown = setInterval(() => {
    seconds--;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const el = document.getElementById('annCountdown');
    if (el) el.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    if (seconds <= 0) clearInterval(window._annCountdown);
  }, 1000);

  // Auto remove after 2 minutes (120 seconds)
  window._annTimer = setTimeout(() => {
    const b = document.getElementById('announcementBanner');
    if (b) {
      b.style.animation = 'annOut 0.4s ease forwards';
      setTimeout(() => b.remove(), 400);
    }
    clearInterval(window._annCountdown);
  }, 120000);
}

function showAdminNotification(icon, title, msg) {
  const n = document.createElement('div');
  n.className = 'admin-notification';
  n.innerHTML = `<div class="an-icon">${icon}</div><div class="an-title">${escapeHtml(title)}</div><div class="an-msg">${escapeHtml(msg)}</div>`;
  document.body.appendChild(n);
  setTimeout(() => { n.classList.add('removing'); setTimeout(() => n.remove(), 300); }, 5000);
}

// ---- WebSocket ----
function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${proto}//${location.host}?app=TheLongAfter`);

  ws.onopen = () => {
    console.log('Connected to TheLongAfter');
    ws.send(JSON.stringify({ type: 'join', username: myUsername, color: myColor }));
  };

  ws.onmessage = (e) => {
    try { handleMessage(JSON.parse(e.data)); } catch(er) { console.error('Parse error:', er); }
  };

  ws.onclose = () => {
    console.log('Disconnected, reconnecting in 3s...');
    setTimeout(() => { if (myUsername) connectWS(); }, 3000);
  };

  ws.onerror = (err) => console.error('WS Error:', err);
}

function send(data) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(data));
}

// ---- Handle Messages ----
function handleMessage(data) {
  switch (data.type) {
    case 'message': handleChatMessage(data); break;
    case 'dm': handleDM(data); break;
    case 'history': handleHistory(data); break;
    case 'users': handleUsers(data); break;
    case 'user_joined': handleUserJoined(data); break;
    case 'user_left': handleUserLeft(data); break;
    case 'typing': handleTyping(data); break;
    case 'stop_typing': handleStopTyping(data); break;
    case 'edit': handleEdit(data); break;
    case 'delete': handleDelete(data); break;
    case 'reaction': handleReaction(data); break;
    case 'channel_created': addChannelToList(data.channel); break;
    case 'channel_deleted': removeChannelFromList(data.channel); break;
    case 'announcement':
  showAnnouncement(data.text);
  break;
    case 'admin_action': handleAdminAction(data); break;
    case 'error': showToast('error', data.message); break;
  }
}

function handleChatMessage(msg) {
  if (msg.channel === currentChannel && !currentDM) {
    appendMessage(msg);
  } else {
    unreadCounts[msg.channel] = (unreadCounts[msg.channel] || 0) + 1;
    updateUnreadBadges();
  }
}

function handleDM(msg) {
  const otherUser = msg.from === myUsername ? msg.to : msg.from;
  addDMToList(otherUser);
  if (currentDM === otherUser) {
    appendMessage(msg);
  } else {
    unreadCounts['dm_' + otherUser] = (unreadCounts['dm_' + otherUser] || 0) + 1;
    updateUnreadBadges();
    showToast('info', `DM from ${msg.from}: ${msg.text.substring(0, 50)}`);
  }
}

function handleHistory(data) {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';
  lastMessageDate = '';
  messageElements = {};
  if (data.messages && data.messages.length > 0) {
    document.getElementById('emptyState')?.remove();
    data.messages.forEach(msg => appendMessage(msg));
    scrollToBottom();
  } else {
    container.innerHTML = `<div class="empty-state"><div class="es-icon">💬</div><h3>No messages yet</h3><p>Be the first to say something!</p></div>`;
  }
}

function handleUsers(data) {
  onlineUsers = data.users || {};
  renderUserList();
}

function handleUserJoined(data) {
  if (data.username !== myUsername) showToast('info', `${data.username} joined the chat`);
}

function handleUserLeft(data) {
  showToast('info', `${data.username} left the chat`);
}

function handleTyping(data) {
  if (data.username === myUsername) return;
  const key = data.dm ? `dm_${data.username}` : `ch_${data.channel}`;
  typingUsers[key] = data.username;
  updateTypingIndicator();
  setTimeout(() => { delete typingUsers[key]; updateTypingIndicator(); }, 3000);
}

function handleStopTyping(data) {
  if (data.username === myUsername) return;
  const key = data.dm ? `dm_${data.username}` : `ch_${data.channel}`;
  delete typingUsers[key];
  updateTypingIndicator();
}

function handleEdit(data) {
  const el = messageElements[data.id];
  if (el) {
    const textEl = el.querySelector('.msg-text');
    if (textEl) textEl.innerHTML = formatText(data.text);
    let edited = el.querySelector('.msg-edited');
    if (!edited) {
      edited = document.createElement('span');
      edited.className = 'msg-edited';
      edited.textContent = '(edited)';
      el.querySelector('.msg-header')?.appendChild(edited);
    }
  }
}

function handleDelete(data) {
  const el = messageElements[data.id];
  if (el) { el.remove(); delete messageElements[data.id]; }
}

function handleReaction(data) {
  const el = messageElements[data.id];
  if (!el) return;
  let container = el.querySelector('.msg-reactions');
  if (!container) {
    container = document.createElement('div');
    container.className = 'msg-reactions';
    el.querySelector('.msg-body')?.appendChild(container);
  }
  container.innerHTML = '';
  if (data.reactions) {
    for (const [emoji, users] of Object.entries(data.reactions)) {
      if (users.length > 0) {
        const btn = document.createElement('button');
        btn.className = `reaction-btn ${users.includes(myUsername) ? 'active' : ''}`;
        btn.innerHTML = `${emoji} <span class="r-count">${users.length}</span>`;
        btn.onclick = () => send({ type: 'reaction', id: data.id, emoji, channel: currentDM ? undefined : currentChannel, dm: currentDM || undefined });
        container.appendChild(btn);
      }
    }
  }
}

function handleAdminAction(data) {
  switch (data.action) {
    case 'welcome': showAdminNotification('👋', 'Welcome', data.message); break;
    case 'mute_notice': showAdminNotification('🔇', 'Muted', data.message); break;
    case 'kick': showAdminNotification('👢', 'Kicked', data.message); setTimeout(disconnect, 2000); break;
    case 'suspend': showAdminNotification('⛔', 'Suspended', data.message); setTimeout(disconnect, 2000); break;
    case 'ban': showAdminNotification('🚫', 'Banned', data.message); setTimeout(disconnect, 2000); break;
    case 'warn': showAdminNotification('⚠️', 'Warning', data.message); break;
    case 'mute': showAdminNotification('🔇', 'Muted', data.message); break;
    case 'unmute': showAdminNotification('🔊', 'Unmuted', data.message); break;
  }
}

// ---- Render Messages ----
function appendMessage(msg) {
  const container = document.getElementById('messagesContainer');
  document.getElementById('emptyState')?.remove();

  if (msg.system) {
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.innerHTML = `${escapeHtml(msg.text)} <span class="sys-time">${formatTime(msg.timestamp)}</span>`;
    container.appendChild(div);
    scrollToBottom();
    return;
  }

  // Date divider
  const msgDate = formatDate(msg.timestamp);
  if (msgDate !== lastMessageDate) {
    lastMessageDate = msgDate;
    const divider = document.createElement('div');
    divider.className = 'date-divider';
    divider.textContent = msgDate;
    container.appendChild(divider);
  }

  const div = document.createElement('div');
  div.className = 'msg-group';
  div.dataset.id = msg.id;
  div.dataset.username = msg.username || msg.from;
  div.dataset.text = msg.text || '';
  div.oncontextmenu = (e) => { e.preventDefault(); showContextMenu(e, msg); };

  const color = msg.color || '#6C63FF';
  const username = msg.username || msg.from || '?';

  let replyHTML = '';
  if (msg.replyTo) {
    replyHTML = `<div class="msg-reply-ref" onclick="scrollToMessage('${msg.replyTo}')"><span class="reply-user">↩ ${escapeHtml(msg.replyUser || '?')}</span> ${escapeHtml((msg.replyText || '').substring(0, 60))}</div>`;
  }

  let fileHTML = '';
  if (msg.file) {
    if (msg.file.type && msg.file.type.startsWith('image/')) {
      fileHTML = `<div class="msg-file"><img src="${msg.file.data}" alt="image" onclick="viewImage('${msg.file.data}')"></div>`;
    } else {
      fileHTML = `<div class="msg-file"><a class="file-download" href="${msg.file.data}" download="${escapeHtml(msg.file.name || 'file')}">📄 ${escapeHtml(msg.file.name || 'File')} <span style="color:var(--text3)">(${formatFileSize(msg.file.size || 0)})</span></a></div>`;
    }
  }

  let reactionsHTML = '';
  if (msg.reactions && Object.keys(msg.reactions).length > 0) {
    reactionsHTML = '<div class="msg-reactions">';
    for (const [emoji, users] of Object.entries(msg.reactions)) {
      if (users.length > 0) {
        const active = users.includes(myUsername) ? ' active' : '';
        reactionsHTML += `<button class="reaction-btn${active}" onclick="reactTo('${msg.id}','${emoji}')">${emoji} <span class="r-count">${users.length}</span></button>`;
      }
    }
    reactionsHTML += '</div>';
  }

  div.innerHTML = `
    <div class="msg-avatar" style="background:${color}">${username[0].toUpperCase()}</div>
    <div class="msg-body">
      ${replyHTML}
      <div class="msg-header">
        <span class="msg-username" style="color:${color}" onclick="startDM('${escapeHtml(username)}')">${escapeHtml(username)}</span>
        <span class="msg-time">${formatTime(msg.timestamp)}</span>
        ${msg.edited ? '<span class="msg-edited">(edited)</span>' : ''}
      </div>
      <div class="msg-text">${formatText(msg.text || '')}</div>
      ${fileHTML}
      ${reactionsHTML}
    </div>
    <div class="msg-actions">
      <button class="msg-action-btn" title="React" onclick="quickReact('${msg.id}')">😊</button>
      <button class="msg-action-btn" title="Reply" onclick="setReply('${msg.id}','${escapeHtml(username)}','${escapeHtml((msg.text||'').substring(0,60).replace(/'/g,"\\'"))}')">↩️</button>
      ${(msg.username === myUsername || msg.from === myUsername) ? `<button class="msg-action-btn" title="More" onclick="showContextMenu(event, null, '${msg.id}')">⋯</button>` : ''}
    </div>
  `;

  messageElements[msg.id] = div;
  container.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  const c = document.getElementById('messagesContainer');
  requestAnimationFrame(() => { c.scrollTop = c.scrollHeight; });
}

function scrollToMessage(id) {
  const el = messageElements[id];
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.background = 'rgba(108,99,255,.1)';
    setTimeout(() => { el.style.background = ''; }, 2000);
  }
}

// ---- Channel / DM Switching ----
function switchChannel(channel) {
  currentChannel = channel;
  currentDM = null;
  document.getElementById('chatTitle').textContent = `# ${channel}`;
  document.getElementById('chatSubtitle').textContent = `Welcome to #${channel}`;
  document.querySelectorAll('.channel-item').forEach(el => {
    el.classList.toggle('active', el.dataset.channel === channel);
  });
  document.querySelectorAll('[data-dm]').forEach(el => el.classList.remove('active'));
  unreadCounts[channel] = 0;
  updateUnreadBadges();
  send({ type: 'get_history', channel });
  closeSidebar();
}

function startDM(username) {
  if (username === myUsername) return;
  currentDM = username;
  currentChannel = null;
  document.getElementById('chatTitle').textContent = `✉️ ${username}`;
  document.getElementById('chatSubtitle').textContent = `Direct message with ${username}`;
  document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('[data-dm]').forEach(el => {
    el.classList.toggle('active', el.dataset.dm === username);
  });
  addDMToList(username);
  unreadCounts['dm_' + username] = 0;
  updateUnreadBadges();
  send({ type: 'get_dm_history', user: username });
  closeSidebar();
}

function addChannelToList(name) {
  const list = document.getElementById('channelList');
  if (list.querySelector(`[data-channel="${name}"]`)) return;
  const div = document.createElement('div');
  div.className = 'channel-item';
  div.dataset.channel = name;
  div.onclick = () => switchChannel(name);
  div.innerHTML = `<span class="ch-icon">#</span><span class="ch-name">${escapeHtml(name)}</span>`;
  list.appendChild(div);
}

function removeChannelFromList(name) {
  const el = document.querySelector(`[data-channel="${name}"]`);
  if (el) el.remove();
  if (currentChannel === name) switchChannel('general');
}

function addDMToList(username) {
  const list = document.getElementById('dmList');
  if (list.querySelector(`[data-dm="${username}"]`)) return;
  const div = document.createElement('div');
  div.className = 'channel-item';
  div.dataset.dm = username;
  div.onclick = () => startDM(username);
  const color = onlineUsers[username]?.color || '#6C63FF';
  div.innerHTML = `<span class="ch-icon" style="color:${color}">●</span><span class="ch-name">${escapeHtml(username)}</span>`;
  list.appendChild(div);
}

// ---- User List ----
function renderUserList() {
  const list = document.getElementById('userList');
  const entries = Object.entries(onlineUsers);
  document.getElementById('onlineCount').textContent = entries.length;
  list.innerHTML = entries.map(([name, data]) => `
    <div class="user-item" onclick="startDM('${escapeHtml(name)}')">
      <div class="user-avatar" style="background:${data.color || '#6C63FF'}">${name[0].toUpperCase()}</div>
      <span class="user-name">${escapeHtml(name)}${name === myUsername ? ' (you)' : ''}</span>
      <span class="user-dot"></span>
    </div>
  `).join('');
}

function updateUnreadBadges() {
  document.querySelectorAll('.channel-item').forEach(el => {
    const ch = el.dataset.channel;
    const dm = el.dataset.dm;
    const key = dm ? 'dm_' + dm : ch;
    let badge = el.querySelector('.unread');
    const count = unreadCounts[key] || 0;
    if (count > 0) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'unread'; el.appendChild(badge); }
      badge.textContent = count;
    } else {
      if (badge) badge.remove();
    }
  });
}

// ---- Typing ----
function updateTypingIndicator() {
  const area = document.getElementById('typingArea');
  const relevant = [];
  for (const [key, user] of Object.entries(typingUsers)) {
    if (currentDM && key === `dm_${currentDM}`) relevant.push(user);
    else if (!currentDM && key === `ch_${currentChannel}`) relevant.push(user);
  }
  if (relevant.length > 0) {
    const names = relevant.slice(0, 3).join(', ');
    area.innerHTML = `<span>${escapeHtml(names)} ${relevant.length === 1 ? 'is' : 'are'} typing</span><span class="typing-dots"><span></span><span></span><span></span></span>`;
  } else {
    area.innerHTML = '';
  }
}

// ---- Input ----
function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function handleInput() {
  const input = document.getElementById('msgInput');
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  document.getElementById('sendBtn').disabled = !input.value.trim() && !selectedFile;

  // Send typing indicator
  if (!isTyping && input.value.trim()) {
    isTyping = true;
    send({ type: 'typing', channel: currentDM ? undefined : currentChannel, dm: currentDM || undefined });
  }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    if (isTyping) {
      isTyping = false;
      send({ type: 'stop_typing', channel: currentDM ? undefined : currentChannel, dm: currentDM || undefined });
    }
  }, 2000);
}

function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text && !selectedFile) return;

  const msg = { text };

  if (replyTo) {
    msg.replyTo = replyTo.id;
    msg.replyText = replyTo.text;
    msg.replyUser = replyTo.username;
  }

  if (selectedFile) {
    msg.file = selectedFile;
  }

  if (currentDM) {
    msg.type = 'dm';
    msg.to = currentDM;
  } else {
    msg.type = 'message';
    msg.channel = currentChannel;
  }

  send(msg);
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;
  cancelReply();
  removeFile();

  if (isTyping) {
    isTyping = false;
    send({ type: 'stop_typing', channel: currentDM ? undefined : currentChannel, dm: currentDM || undefined });
  }
}

// ---- Reply ----
function setReply(id, username, text) {
  replyTo = { id, username, text };
  document.getElementById('rpUser').textContent = username;
  document.getElementById('rpText').textContent = text;
  document.getElementById('replyPreview').style.display = 'flex';
  document.getElementById('msgInput').focus();
  closeContextMenu();
}

function cancelReply() {
  replyTo = null;
  document.getElementById('replyPreview').style.display = 'none';
}

// ---- File ----
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('error', 'File too large. Max 5MB.'); return; }

  const reader = new FileReader();
  reader.onload = () => {
    selectedFile = { name: file.name, type: file.type, size: file.size, data: reader.result };
    document.getElementById('fpName').textContent = file.name;
    document.getElementById('fpSize').textContent = formatFileSize(file.size);
    document.getElementById('filePreview').style.display = 'flex';
    document.getElementById('sendBtn').disabled = false;
  };
  reader.readAsDataURL(file);
}

function removeFile() {
  selectedFile = null;
  document.getElementById('filePreview').style.display = 'none';
  document.getElementById('fileInput').value = '';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function viewImage(src) {
  document.getElementById('viewerImg').src = src;
  document.getElementById('imageViewer').classList.add('show');
}

// ---- Emoji ----
function toggleEmojiPicker() {
  document.getElementById('emojiPicker').classList.toggle('show');
}

function initEmojiPicker() {
  const grid = document.getElementById('emojiGrid');
  grid.innerHTML = EMOJIS.map(e => `<div class="emoji-item" onclick="insertEmoji('${e}')">${e}</div>`).join('');
}

function insertEmoji(emoji) {
  const input = document.getElementById('msgInput');
  input.value += emoji;
  input.focus();
  handleInput();
  document.getElementById('emojiPicker').classList.remove('show');
}

// ---- Reactions ----
function reactTo(id, emoji) {
  send({ type: 'reaction', id, emoji, channel: currentDM ? undefined : currentChannel, dm: currentDM || undefined });
}

function quickReact(id) {
  reactTo(id, '👍');
  closeContextMenu();
}

// ---- Context Menu ----
function showContextMenu(e, msg, msgId) {
  e.preventDefault?.();
  e.stopPropagation?.();

  const menu = document.getElementById('contextMenu');

  if (msgId) {
    const el = messageElements[msgId];
    if (el) {
      msg = { id: msgId, username: el.dataset.username, text: el.dataset.text };
    }
  }

  if (!msg) return;
  contextTarget = msg;

  const isOwn = (msg.username === myUsername || msg.from === myUsername);
  document.getElementById('ctxEdit').style.display = isOwn ? 'flex' : 'none';
  document.getElementById('ctxDelete').style.display = isOwn ? 'flex' : 'none';

  const x = Math.min(e.clientX || e.pageX || 200, window.innerWidth - 200);
  const y = Math.min(e.clientY || e.pageY || 200, window.innerHeight - 200);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.add('show');
}

function closeContextMenu() {
  document.getElementById('contextMenu').classList.remove('show');
  contextTarget = null;
}

function ctxReply() {
  if (!contextTarget) return;
  setReply(contextTarget.id, contextTarget.username || contextTarget.from, (contextTarget.text || '').substring(0, 60));
}

function ctxReact() {
  if (!contextTarget) return;
  quickReact(contextTarget.id);
}

function ctxCopy() {
  if (!contextTarget) return;
  navigator.clipboard.writeText(contextTarget.text || '').then(() => showToast('success', 'Copied!')).catch(() => {});
  closeContextMenu();
}

function ctxEditMsg() {
  if (!contextTarget) return;
  const newText = prompt('Edit message:', contextTarget.text);
  if (newText !== null && newText.trim()) {
    send({ type: 'edit', id: contextTarget.id, text: newText.trim(), channel: currentDM ? undefined : currentChannel, dm: currentDM || undefined });
  }
  closeContextMenu();
}

function ctxDeleteMsg() {
  if (!contextTarget) return;
  if (confirm('Delete this message?')) {
    send({ type: 'delete', id: contextTarget.id, channel: currentDM ? undefined : currentChannel, dm: currentDM || undefined });
  }
  closeContextMenu();
}

// ---- Channels ----
function openNewChannelModal() {
  document.getElementById('channelModal').classList.add('show');
  document.getElementById('newChannelInput').value = '';
  document.getElementById('newChannelInput').focus();
}

function closeNewChannelModal() {
  document.getElementById('channelModal').classList.remove('show');
}

function createChannel() {
  const name = document.getElementById('newChannelInput').value.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
  if (!name) return;
  send({ type: 'create_channel', channel: name });
  closeNewChannelModal();
}

// ---- Sidebar ----
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarBackdrop').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('show');
}

// ---- Join / Disconnect ----
function joinChat() {
  const input = document.getElementById('usernameInput');
  const name = input.value.trim();
  if (!name) { showLoginError('Please enter a username'); return; }
  if (name.length > 20) { showLoginError('Username too long (max 20)'); return; }
  if (['admin','system','moderator','server'].includes(name.toLowerCase())) { showLoginError('That username is reserved'); return; }

  myUsername = name;
  myColor = document.getElementById('colorPicker').value;

  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.add('visible');
  document.getElementById('myName').textContent = myUsername;
  document.getElementById('myAvatar').textContent = myUsername[0].toUpperCase();
  document.getElementById('myAvatar').style.background = myColor;

  connectWS();
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function disconnect() {
  if (ws) ws.close();
  myUsername = '';
  currentChannel = 'general';
  currentDM = null;
  onlineUsers = {};
  messageElements = {};
  unreadCounts = {};
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('app').classList.remove('visible');
  document.getElementById('usernameInput').value = '';
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initEmojiPicker();

  document.getElementById('usernameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinChat();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.msg-action-btn')) closeContextMenu();
    if (!e.target.closest('.emoji-picker') && !e.target.closest('.emoji-btn')) document.getElementById('emojiPicker').classList.remove('show');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContextMenu();
      closeNewChannelModal();
      document.getElementById('imageViewer').classList.remove('show');
      document.getElementById('emojiPicker').classList.remove('show');
    }
  });
});