(function() {
  'use strict';

  // ===== DOM ELEMENTS =====
  const $ = id => document.getElementById(id);
  const authModal = $('authModal');
  const loginForm = $('loginForm');
  const registerForm = $('registerForm');
  const loginEmail = $('loginEmail');
  const loginPassword = $('loginPassword');
  const loginBtn = $('loginBtn');
  const registerBtn = $('registerBtn');
  const showRegister = $('showRegister');
  const showLogin = $('showLogin');
  const guestBtn = $('guestBtn');
  const chat = $('chat');
  const msgs = $('msgs');
  const msgsWrap = $('msgsWrap');
  const msgForm = $('msgForm');
  const msgInput = $('msgInput');
  const usersList = $('users');
  const searchInput = $('searchInput');
  const countEl = $('count');
  const msgCountEl = $('msgCount');
  const onlineCountEl = $('onlineCount');
  const typingEl = $('typing');
  const connectionStatus = $('connectionStatus');
  const emojiBtn = $('emojiBtn');
  const emojiPicker = $('emojiPicker');
  const emojiGrid = $('emojiGrid');
  const usersModal = $('usersModal');
  const allUsersList = $('allUsersList');
  const closeUsersModal = $('closeUsersModal');
  const showUsersBtn = $('showUsersBtn');
  const toggleTheme = $('toggleTheme');
  const toggleSound = $('toggleSound');
  const themeIcon = $('themeIcon');
  const soundIcon = $('soundIcon');
  const userPanel = $('userPanel');
  const userAvatar = $('userAvatar');
  const displayName = $('displayName');
  const userStatus = $('userStatus');
  const logoutBtn = $('logoutBtn');
  const authToast = $('authToast');
  
  // Private Message Elements
  const tabPublic = $('tabPublic');
  const tabPrivate = $('tabPrivate');
  const pmBadge = $('pmBadge');
  const usersContainer = $('usersContainer');
  const privateContainer = $('privateContainer');
  const privateChats = $('privateChats');
  const newPmBtn = $('newPmBtn');
  const newPmModal = $('newPmModal');
  const closeNewPmModal = $('closeNewPmModal');
  const pmRecipient = $('pmRecipient');
  const pmMessage = $('pmMessage');
  const sendPmBtn = $('sendPmBtn');
  const chatTitle = $('chatTitle');
  const headerStatus = $('headerStatus');

  // ===== STATE =====
  var ws = null;
  var myId = null;
  var myUsername = '';
  var myColor = '#e94560';
  var isTyping = false;
  var typingTimeout = null;
  var typingUsers = {};
  var messageCount = 0;
  var isConnected = false;
  var onlineUsers = [];
  var soundEnabled = true;
  var searchQuery = '';
  
  // Auth state
  var isAuthenticated = false;
  var authToken = null;
  var userEmail = null;
  var guestMode = false;
  
  // Private Messages State
  var currentChatType = 'public'; // 'public' or 'private'
  var currentPrivateChat = null; // username of current private chat
  var privateMessages = {}; // { username: [messages] }
  var unreadPMs = {}; // { username: count }
  var totalUnreadPMs = 0;

  // ===== COLORS & EMOJIS =====
  const userColors = [
    '#e94560', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#84cc16', '#d946ef', '#0ea5e9', '#22c55e'
  ];

  const emojiCategories = {
    smileys: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬'],
    hearts: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️'],
    gestures: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'],
    objects: ['💡','🔔','📢','📣','💬','💭','🗯️','✅','❌','⭐','🌟','✨','💫','🔥','💥','💯','🎉','🎊','🎁','🏆','🎯','🎮','🎲','🎭','🎨','🎬','📱','💻','📸','🎤','🎧','🎵','📚']
  };

  // ===== INITIALIZATION =====
  function init() {
    setupEmojiPicker();
    setupEventListeners();
    checkExistingSession();
    connect();
    setupStorageListener();
    requestNotificationPermission();
  }
  
  // ===== BROWSER NOTIFICATIONS =====
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  
  function showBrowserNotification(title, body, icon, tag) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: icon || '/icons/icon-192x192.png',
        tag: tag || 'poeverse-chat',
        vibrate: [200, 100, 200],
        requireInteraction: false
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      setTimeout(() => notification.close(), 5000);
    }
  }
  
  function showInAppNotification(title, body, type, color) {
    // Remove existing notifications
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification-toast ' + type;
    notification.innerHTML = `
      <div class="notification-toast-header">
        <div class="notification-toast-avatar" style="background: ${color || '#e94560'}">${title[0].toUpperCase()}</div>
        <div class="notification-toast-title">${escapeHtml(title)}</div>
      </div>
      <div class="notification-toast-body">${escapeHtml(body)}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
  
  // Add slideOutRight animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // ===== MULTI-TAB SYNC =====
  function setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'poeverse_chat_sync') {
        try {
          const data = JSON.parse(e.newValue);
          if (data && data.type === 'message_sync' && data.username === myUsername) {
            addMsg(data, false, true);
            messageCount++;
            updateMessageCount();
          }
        } catch (err) {}
      }
    });
  }

  function syncMessageToTabs(messageData) {
    const syncData = {
      ...messageData,
      type: 'message_sync',
      timestamp: Date.now()
    };
    localStorage.setItem('poeverse_chat_sync', JSON.stringify(syncData));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'poeverse_chat_sync',
      newValue: JSON.stringify(syncData)
    }));
  }

  // ===== SESSION MANAGEMENT =====
  function checkExistingSession() {
    const savedToken = localStorage.getItem('poeverse_chat_token');
    const savedEmail = localStorage.getItem('poeverse_chat_email');
    const savedUsername = localStorage.getItem('poeverse_chat_username');
    
    if (savedToken && savedUsername) {
      verifyToken(savedToken, savedUsername);
    } else {
      showAuthModal();
    }
  }

  function verifyToken(token, expectedUsername) {
    const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
    fetch(`${protocol}//${location.host}/api/auth/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          authToken = token;
          userEmail = data.user.userId;
          myUsername = data.user.username;
          isAuthenticated = true;
          showChat();
        } else {
          localStorage.removeItem('poeverse_chat_token');
          localStorage.removeItem('poeverse_chat_email');
          localStorage.removeItem('poeverse_chat_username');
          showAuthModal();
        }
      })
      .catch(() => showAuthModal());
  }

  // ===== AUTH FUNCTIONS =====
  function showAuthModal() {
    if (authModal) authModal.classList.remove('hidden');
    if (chat) chat.classList.add('hidden');
    if (loginForm) loginForm.classList.remove('hidden');
    if (registerForm) registerForm.classList.add('hidden');
  }

  function showChat() {
    console.log('Showing chat...');
    if (authModal) authModal.classList.add('hidden');
    if (chat) chat.classList.remove('hidden');
    loadChatHistory();
    if (ws && ws.readyState === WebSocket.OPEN) {
      sendJoin();
    }
    updateUserPanel();
  }

  function showToast(message, type = 'info') {
    if (!authToast) return;
    authToast.textContent = message;
    authToast.className = 'auth-toast ' + type;
    authToast.classList.remove('hidden');
    setTimeout(() => authToast.classList.add('hidden'), 3000);
  }

  async function handleLogin() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    if (!email || !password) {
      showToast('Please enter email and password', 'error');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';

    try {
      const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
      const res = await fetch(`${protocol}//${location.host}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        authToken = data.token;
        userEmail = data.user.email;
        myUsername = data.user.username;
        isAuthenticated = true;
        guestMode = false;
        
        localStorage.setItem('poeverse_chat_token', data.token);
        localStorage.setItem('poeverse_chat_email', data.user.email);
        localStorage.setItem('poeverse_chat_username', data.user.username);
        
        showToast('Welcome back, ' + myUsername + '!', 'success');
        showChat();
      } else {
        showToast(data.error || 'Login failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }

  async function handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (!username || !email || !password) {
      showToast('All fields required', 'error');
      return;
    }
    
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating account...';

    try {
      const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
      const res = await fetch(`${protocol}//${location.host}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        authToken = data.token;
        userEmail = data.user.email;
        myUsername = data.user.username;
        isAuthenticated = true;
        guestMode = false;
        
        localStorage.setItem('poeverse_chat_token', data.token);
        localStorage.setItem('poeverse_chat_email', data.user.email);
        localStorage.setItem('poeverse_chat_username', data.user.username);
        
        showToast('Account created! Welcome, ' + myUsername + '!', 'success');
        showChat();
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create Account';
  }

  function handleGuest() {
    myUsername = 'Guest_' + Math.floor(Math.random() * 1000);
    guestMode = true;
    isAuthenticated = false;
    showChat();
  }

  async function handleLogout() {
    if (authToken) {
      const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
      try {
        await fetch(`${protocol}//${location.host}/api/auth/logout?token=${authToken}`, {
          method: 'POST'
        });
      } catch (e) {}
    }
    
    authToken = null;
    userEmail = null;
    isAuthenticated = false;
    guestMode = false;
    
    localStorage.removeItem('poeverse_chat_token');
    localStorage.removeItem('poeverse_chat_email');
    localStorage.removeItem('poeverse_chat_username');
    
    showToast('Logged out successfully', 'success');
    showAuthModal();
  }

  function updateUserPanel() {
    if (!userPanel) return;
    
    if (isAuthenticated || guestMode) {
      userPanel.style.display = 'flex';
      if (userAvatar) {
        userAvatar.textContent = myUsername[0].toUpperCase();
        userAvatar.style.background = myColor;
      }
      if (displayName) {
        displayName.textContent = myUsername;
      }
      if (userStatus) {
        userStatus.textContent = isAuthenticated ? 'Registered User' : 'Guest';
      }
      if (logoutBtn) {
        logoutBtn.style.display = 'block';
      }
    }
  }

  // ===== EMOJI PICKER =====
  function setupEmojiPicker() {
    if (!emojiGrid) return;
    
    document.querySelectorAll('.emoji-cat').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.emoji-cat').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showEmojis(btn.dataset.cat);
      };
    });
    
    showEmojis('smileys');
  }

  function showEmojis(category) {
    if (!emojiGrid) return;
    emojiGrid.innerHTML = '';
    
    const emojis = emojiCategories[category] || [];
    emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.className = 'emoji-item';
      btn.textContent = emoji;
      btn.onclick = () => {
        msgInput.value += emoji;
        msgInput.focus();
      };
      emojiGrid.appendChild(btn);
    });
  }

  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    // Auth forms
    if (loginBtn) loginBtn.onclick = handleLogin;
    if (registerBtn) registerBtn.onclick = handleRegister;
    if (guestBtn) guestBtn.onclick = handleGuest;
    if (showRegister) showRegister.onclick = function() {
      if (loginForm) loginForm.classList.add('hidden');
      if (registerForm) registerForm.classList.remove('hidden');
    };
    if (showLogin) showLogin.onclick = function() {
      if (registerForm) registerForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
    };
    if (logoutBtn) logoutBtn.onclick = handleLogout;
    
    // Message form
    if (msgForm) {
      msgForm.addEventListener('submit', handleMessage);
    }

    // Message input
    if (msgInput) {
      msgInput.addEventListener('input', handleInput);
      msgInput.addEventListener('keydown', handleKeydown);
    }

    // Emoji picker
    if (emojiBtn && emojiPicker) {
      emojiBtn.onclick = () => emojiPicker.classList.toggle('hidden');
    }
    document.addEventListener('click', (e) => {
      if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.classList.add('hidden');
      }
    });

    // Search
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }

    // Chat tabs (Public/Private)
    if (tabPublic) {
      tabPublic.addEventListener('click', () => switchChatTab('public'));
    }
    if (tabPrivate) {
      tabPrivate.addEventListener('click', () => switchChatTab('private'));
    }

    // New Private Message
    if (newPmBtn) {
      newPmBtn.addEventListener('click', openNewPmModal);
    }
    if (closeNewPmModal && newPmModal) {
      closeNewPmModal.onclick = () => newPmModal.classList.add('hidden');
      newPmModal.querySelector('.modal-backdrop').onclick = () => newPmModal.classList.add('hidden');
    }
    if (sendPmBtn) {
      sendPmBtn.addEventListener('click', sendPrivateMessage);
    }

    // Users modal
    if (showUsersBtn && usersModal) {
      showUsersBtn.onclick = showAllUsers;
    }
    if (closeUsersModal && usersModal) {
      closeUsersModal.onclick = () => usersModal.classList.add('hidden');
      const backdrop = usersModal.querySelector('.modal-backdrop');
      if (backdrop) backdrop.onclick = () => usersModal.classList.add('hidden');
    }

    // Theme & Sound
    if (toggleTheme) toggleTheme.onclick = toggleThemeMode;
    if (toggleSound) toggleSound.onclick = toggleSoundSetting;
    
    // Mobile menu toggle
    const mobileMenuBtn = $('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.onclick = () => {
        document.querySelector('.sidebar').classList.toggle('mobile-open');
      };
    }
  }

  // ===== CHAT TABS (Public/Private) =====
  function switchChatTab(tab) {
    currentChatType = tab;
    
    // Update tab UI
    if (tabPublic && tabPrivate) {
      tabPublic.classList.toggle('active', tab === 'public');
      tabPrivate.classList.toggle('active', tab === 'private');
    }
    
    // Show/hide appropriate containers
    if (usersContainer && privateContainer) {
      usersContainer.classList.toggle('hidden', tab !== 'public');
      privateContainer.classList.toggle('hidden', tab !== 'private');
    }
    
    // Update header
    if (tab === 'public') {
      if (chatTitle) chatTitle.textContent = '📢 Public Chat';
      if (headerStatus) {
        headerStatus.innerHTML = '<span class="online-dot"></span><span id="onlineCount">' + onlineUsers.length + '</span> users online';
      }
      currentPrivateChat = null;
      displayPublicMessages();
    } else {
      if (chatTitle) chatTitle.textContent = '🔒 Private Messages';
      if (headerStatus) {
        headerStatus.textContent = currentPrivateChat ? 'Chatting with ' + currentPrivateChat : 'Select a conversation';
      }
      displayPrivateMessages();
    }
    
    // Clear input placeholder
    if (msgInput) {
      msgInput.placeholder = tab === 'public' 
        ? 'Type a message... (Use @username to mention)' 
        : 'Type a private message...';
    }
    
    scrollToBottom();
  }

  // ===== PRIVATE MESSAGE FUNCTIONS =====
  function openNewPmModal() {
    if (newPmModal) {
      newPmModal.classList.remove('hidden');
      if (pmRecipient) {
        pmRecipient.value = '';
        pmRecipient.focus();
      }
      if (pmMessage) pmMessage.value = '';
    }
  }

  function sendPrivateMessage() {
    const recipient = pmRecipient.value.trim();
    const message = pmMessage.value.trim();
    
    if (!recipient) {
      showToast('Please enter a recipient', 'error');
      return;
    }
    
    if (!message) {
      showToast('Please enter a message', 'error');
      return;
    }
    
    if (recipient === myUsername) {
      showToast("You can't send a private message to yourself", 'error');
      return;
    }
    
    // Send via WebSocket
    const pmData = {
      type: 'private_message',
      to: recipient,
      text: message,
      color: myColor
    };
    
    send(pmData);
    
    // Add to local messages
    addPrivateMessage(myUsername, recipient, {
      from: myUsername,
      to: recipient,
      text: message,
      color: myColor,
      timestamp: Date.now(),
      isSent: true
    });
    
    showToast('Private message sent to ' + recipient, 'success');
    
    if (newPmModal) newPmModal.classList.add('hidden');
    if (pmMessage) pmMessage.value = '';
    
    // Switch to private tab and show conversation
    switchChatTab('private');
    openPrivateChat(recipient);
  }

  function addPrivateMessage(from, to, message) {
    const otherUser = from === myUsername ? to : from;
    
    if (!privateMessages[otherUser]) {
      privateMessages[otherUser] = [];
    }
    
    privateMessages[otherUser].push(message);
    
    // Update unread if not current chat
    if (currentChatType !== 'private' || currentPrivateChat !== otherUser) {
      if (!unreadPMs[otherUser]) unreadPMs[otherUser] = 0;
      unreadPMs[otherUser]++;
      totalUnreadPMs++;
      updatePMBadge();
    }
    
    // Update UI if viewing this chat
    if (currentChatType === 'private' && currentPrivateChat === otherUser) {
      displayPrivateMessages();
    } else {
      updatePrivateChatsList();
    }
  }

  function updatePMBadge() {
    if (pmBadge) {
      pmBadge.textContent = totalUnreadPMs;
      pmBadge.classList.toggle('hidden', totalUnreadPMs === 0);
    }
  }

  function openPrivateChat(username) {
    currentPrivateChat = username;
    
    // Clear unread
    if (unreadPMs[username]) {
      totalUnreadPMs -= unreadPMs[username];
      unreadPMs[username] = 0;
      updatePMBadge();
    }
    
    if (headerStatus) {
      headerStatus.textContent = 'Chatting with ' + username;
    }
    
    displayPrivateMessages();
  }

  function displayPrivateMessages() {
    if (!msgs) return;
    msgs.innerHTML = '';
    
    if (!currentPrivateChat || !privateMessages[currentPrivateChat]) {
      msgs.innerHTML = '<div class="sys">No messages yet. Start a conversation!</div>';
      return;
    }
    
    const messages = privateMessages[currentPrivateChat];
    messages.forEach(msg => {
      addMsg(msg, true, msg.from === myUsername || msg.isSent);
    });
    
    scrollToBottom();
  }

  function displayPublicMessages() {
    // This is handled by the WebSocket message handler
    // Just refresh the view
  }

  function updatePrivateChatsList() {
    if (!privateChats) return;
    privateChats.innerHTML = '';
    
    const users = Object.keys(privateMessages);
    
    if (users.length === 0) {
      privateChats.innerHTML = '<li class="no-chats">No private messages yet</li>';
      return;
    }
    
    users.forEach(user => {
      const li = document.createElement('li');
      li.className = 'private-chat-item' + (user === currentPrivateChat ? ' active' : '');
      
      const unread = unreadPMs[user] || 0;
      const lastMsg = privateMessages[user][privateMessages[user].length - 1];
      const preview = lastMsg ? lastMsg.text.substring(0, 30) + (lastMsg.text.length > 30 ? '...' : '') : 'No messages';
      
      li.innerHTML = `
        <div class="chat-user-avatar">${user[0].toUpperCase()}</div>
        <div class="chat-user-info">
          <div class="chat-user-name">${escapeHtml(user)}${unread > 0 ? '<span class="unread-count">' + unread + '</span>' : ''}</div>
          <div class="chat-user-preview">${escapeHtml(preview)}</div>
      `;
      
      li.onclick = () => {
        switchChatTab('private');
        openPrivateChat(user);
      };
      
      privateChats.appendChild(li);
    });
  }

  // ===== MESSAGE HANDLERS =====
  function handleMessage(e) {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;

    // Check if in private mode and has a conversation open
    if (currentChatType === 'private' && currentPrivateChat) {
      const messageData = { 
        type: 'private_message', 
        to: currentPrivateChat,
        text: text, 
        color: myColor 
      };
      send(messageData);
      
      addPrivateMessage(myUsername, currentPrivateChat, {
        from: myUsername,
        to: currentPrivateChat,
        text: text,
        color: myColor,
        timestamp: Date.now(),
        isSent: true
      });
    } else {
      // Public message
      const messageData = { type: 'message', text: text, color: myColor };
      send(messageData);
      
      // Sync to other tabs for same user
      if (isAuthenticated) {
        syncMessageToTabs({
          id: myId,
          username: myUsername,
          color: myColor,
          text: text,
          authenticated: true
        });
      }
    }
    
    msgInput.value = '';
    msgInput.style.height = 'auto';

    if (isTyping) {
      isTyping = false;
      send({ type: 'typing', isTyping: false });
    }
    clearTimeout(typingTimeout);
  }

  function handleInput() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    
    if (!isTyping) {
      isTyping = true;
      send({ type: 'typing', isTyping: true });
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      send({ type: 'typing', isTyping: false });
    }, 2000);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      msgForm.dispatchEvent(new Event('submit'));
    }
  }

  function handleSearch() {
    searchQuery = searchInput.value.toLowerCase();
    const messages = msgs.querySelectorAll('.msg');
    messages.forEach(msg => {
      const text = msg.textContent.toLowerCase();
      msg.style.display = text.includes(searchQuery) ? 'flex' : 'none';
    });
  }

  // ===== WEBSOCKET =====
  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}`;
    
    console.log('Connecting to:', wsUrl);
    updateConnectionStatus('connecting');
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Connected');
      isConnected = true;
      updateConnectionStatus('connected');
      if (!authModal.classList.contains('hidden')) {
        // Wait for auth
      } else {
        sendJoin();
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessageWS(data);
    };

    ws.onclose = () => {
      console.log('❌ Disconnected');
      isConnected = false;
      updateConnectionStatus('disconnected');
      addSysMsg('⚠️ Connection lost. Reconnecting in 3s...');
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnected = false;
      updateConnectionStatus('error');
    };
  }

  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function sendJoin() {
    send({ 
      type: 'join', 
      username: myUsername, 
      color: myColor,
      authenticated: isAuthenticated 
    });
  }

  function handleMessageWS(data) {
    switch (data.type) {
      case 'welcome':
        myId = data.id;
        myColor = data.color || myColor;
        sendJoin();
        break;

      case 'user_joined':
        if (data.id !== myId) {
          addSysMsg('✨ ' + escapeHtml(data.username) + ' joined');
          if (data.authenticated) {
            addSysMsg('⭐ ' + escapeHtml(data.username) + ' is a verified member!');
          }
        }
        onlineUsers = data.users;
        updateUsers(data.users);
        break;

      case 'user_left':
        addSysMsg('👋 ' + escapeHtml(data.username) + ' left');
        delete typingUsers[data.id];
        onlineUsers = data.users;
        updateUsers(data.users);
        updateTyping();
        break;

      case 'message':
        // Only display in public chat mode
        if (currentChatType === 'public') {
          addMsg(data);
          messageCount++;
          updateMessageCount();
        }
        delete typingUsers[data.id];
        updateTyping();
        break;
        
      case 'private_message':
        // Handle incoming private message
        addPrivateMessage(data.from.username, myUsername, {
          from: data.from.username,
          to: myUsername,
          text: data.text,
          color: data.from.color,
          timestamp: data.timestamp,
          isSent: false
        });
        
        // Show notifications
        showInAppNotification('🔒 Private Message', data.from.username + ': ' + data.text.substring(0, 50), 'pm', data.from.color);
        showBrowserNotification('🔒 Private Message from ' + data.from.username, data.text.substring(0, 100), '/icons/icon-192x192.png', 'pm-' + data.from.username);
        break;
        
      case 'private_sent':
        // Confirmation that PM was sent
        showToast('🔒 Private message sent to ' + data.to, 'success');
        break;
        
      case 'message_deleted':
        const msgEl = document.querySelector('[data-msg-id="' + data.id + '"]');
        if (msgEl) {
          msgEl.remove();
          addSysMsg('🗑️ Message deleted by ' + escapeHtml(data.deletedBy));
        }
        break;
        
      case 'mention':
        addSysMsg('📢 ' + escapeHtml(data.from.username) + ' mentioned you!');
        showInAppNotification('📢 You were mentioned', data.from.username + ': ' + data.text.substring(0, 50), 'mention', data.from.color);
        showBrowserNotification('📢 ' + data.from.username + ' mentioned you', data.text.substring(0, 100), '/icons/icon-192x192.png', 'mention-' + data.from.username);
        break;
        
      case 'error':
        showToast(data.message, 'error');
        break;

      case 'typing':
        if (data.isTyping) {
          typingUsers[data.id] = data.username;
        } else {
          delete typingUsers[data.id];
        }
        updateTyping();
        break;
    }
  }

  // ===== UI FUNCTIONS =====
  function addSysMsg(text) {
    const div = document.createElement('div');
    div.className = 'sys';
    div.textContent = text;
    msgs.appendChild(div);
    scrollToBottom();
  }

  function addMsg(data, isPrivate = false, isSent = false) {
    const own = data.id === myId || isSent;
    const div = document.createElement('div');
    div.className = 'msg ' + (own ? 'own' : 'other') + ' new';
    if (isPrivate) div.classList.add('private');

    const time = new Date(data.timestamp || Date.now());
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const textHtml = formatMentions(escapeHtml(data.text));
    const fromName = data.from ? data.from.username : data.username;
    const fromColor = data.from ? data.from.color : data.color;
    
    const msgId = data.id + '_' + (data.timestamp || Date.now());
    
    div.dataset.msgId = msgId;
    div.dataset.fromId = data.fromId || data.id;

    const deleteBtn = own ? '<button class="delete-msg-btn" onclick="deleteMessage(\'' + msgId + '\')" title="Delete">🗑️</button>' : '';

    div.innerHTML = 
      '<div class="avatar" style="background:' + (fromColor || '#666') + '">' + ((fromName && fromName[0]) || '?').toUpperCase() + '</div>' +
      '<div class="msg-body">' +
        '<div class="msg-head">' +
          '<span class="msg-name" style="color:' + (fromColor || '#666') + '">' + escapeHtml(fromName) + '</span>' +
          (isPrivate ? '<span class="private-badge">🔒 Private</span>' : '') +
          (data.authenticated ? '<span class="verified-badge">✓</span>' : '') +
          '<span class="msg-time">' + timeStr + '</span>' +
        '</div>' +
        '<div class="bubble">' + textHtml + deleteBtn + '</div>' +
      '</div>';

    msgs.appendChild(div);
    scrollToBottom();
    setTimeout(() => div.classList.remove('new'), 1000);
  }

  window.deleteMessage = function(msgId) {
    if (!confirm('Delete this message?')) return;
    send({ type: 'message', text: '/delete ' + msgId });
  };

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatMentions(text) {
    return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  }

  function scrollToBottom() {
    setTimeout(() => { msgsWrap.scrollTop = msgsWrap.scrollHeight; }, 50);
  }

  function updateUsers(users) {
    const titleHtml = '<p class="users-title">Online Now</p>';
    usersList.innerHTML = titleHtml;
    if (countEl) countEl.textContent = users.length;
    if (onlineCountEl) onlineCountEl.textContent = users.length;
    if (msgCountEl) msgCountEl.textContent = messageCount;

    users.forEach(user => {
      const isMe = user.id === myId;
      const li = document.createElement('li');
      li.className = 'user';
      li.innerHTML = 
        '<span class="user-status"></span>' +
        '<div class="avatar" style="background:' + (user.color || '#666') + '">' + (user.username[0] || '?').toUpperCase() + '</div>' +
        '<div class="user-info">' +
          '<div class="user-name' + (isMe ? ' you' : '') + '">' + escapeHtml(user.username) + (isMe ? ' (You)' : '') + '</div>' +
          '<div class="user-status-text">' + (user.authenticated ? '✓ Verified' : 'Online') + '</div>' +
        '</div>';
      
      // Click to start private message
      if (!isMe) {
        li.onclick = () => {
          switchChatTab('private');
          openPrivateChat(user.username);
        };
        li.style.cursor = 'pointer';
      }
      
      usersList.appendChild(li);
    });
  }

  function showAllUsers() {
    if (!allUsersList) return;
    allUsersList.innerHTML = '';
    
    onlineUsers.forEach(user => {
      const li = document.createElement('li');
      li.className = 'user';
      li.innerHTML = 
        '<div class="avatar" style="background:' + (user.color || '#666') + '">' + (user.username[0] || '?').toUpperCase() + '</div>' +
        '<div class="user-info">' +
          '<div class="user-name">' + escapeHtml(user.username) + '</div>' +
          '<div class="user-status-text">' + (user.authenticated ? '✓ Verified Member' : 'Guest') + '</div>' +
        '</div>';
      
      // Click to start private message
      if (user.id !== myId) {
        li.onclick = () => {
          usersModal.classList.add('hidden');
          switchChatTab('private');
          openPrivateChat(user.username);
        };
        li.style.cursor = 'pointer';
      }
      
      allUsersList.appendChild(li);
    });
    
    usersModal.classList.remove('hidden');
  }

  function updateTyping() {
    const names = Object.keys(typingUsers).map(id => typingUsers[id]).filter(name => name !== myUsername);
    
    if (names.length === 0) {
      typingEl.innerHTML = '';
    } else if (names.length === 1) {
      typingEl.innerHTML = escapeHtml(names[0]) + ' is typing...';
    } else {
      typingEl.innerHTML = names.length + ' people are typing...';
    }
  }

  function updateMessageCount() {
    if (msgCountEl) msgCountEl.textContent = messageCount;
  }

  function updateConnectionStatus(status) {
    if (!connectionStatus) return;
    connectionStatus.className = 'connection-status ' + status;
    
    if (status === 'connected') {
      connectionStatus.innerHTML = '<span>🟢</span><span>Connected</span>';
    } else if (status === 'disconnected' || status === 'error') {
      connectionStatus.innerHTML = '<span>🔴</span><span>Disconnected</span>';
    } else {
      connectionStatus.innerHTML = '<span>🟡</span><span>Connecting...</span>';
    }
  }

  // ===== THEME & SOUND =====
  function toggleThemeMode() {
    const isDark = document.body.getAttribute('data-theme') !== 'light';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    if (themeIcon) themeIcon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('poeverse_chat_theme', isDark ? 'light' : 'dark');
  }

  const savedTheme = localStorage.getItem('poeverse_chat_theme');
  if (savedTheme === 'light') {
    document.body.setAttribute('data-theme', 'light');
    if (themeIcon) themeIcon.textContent = '☀️';
  }

  function toggleSoundSetting() {
    soundEnabled = !soundEnabled;
    if (soundIcon) soundIcon.textContent = soundEnabled ? '🔔' : '🔕';
    localStorage.setItem('poeverse_chat_sound', soundEnabled ? 'on' : 'off');
  }

  const savedSound = localStorage.getItem('poeverse_chat_sound');
  if (savedSound === 'off') {
    soundEnabled = false;
    if (soundIcon) soundIcon.textContent = '🔕';
  }

  // ===== CHAT HISTORY =====
  function loadChatHistory() {
    const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
    const apiUrl = `${protocol}//${location.host}/api/chat-history`;
    
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (data.messages?.length > 0) {
          data.messages.forEach(msg => {
            // Only load public messages initially
            if (!msg.to || msg.to.startsWith('/')) {
              addMsg(msg);
              messageCount++;
            }
          });
          updateMessageCount();
          addSysMsg('📜 Loaded ' + data.messages.length + ' previous messages');
        } else {
          addSysMsg('💬 Welcome to PoeVerse Chat! ' + (isAuthenticated ? 'You are logged in!' : 'Join the conversation!'));
        }
      })
      .catch(() => {
        addSysMsg('💬 Welcome to PoeVerse Chat!');
      });
  }

  // ===== START =====
  init();
})();
