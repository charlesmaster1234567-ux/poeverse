(function() {
  'use strict';

  // ===== DOM ELEMENTS =====
  const $ = id => document.getElementById(id);
  const modal = $('modal');
  const joinForm = $('joinForm');
  const nameInput = $('nameInput');
  const chat = $('chat');
  const msgs = $('msgs');
  const msgsWrap = $('msgsWrap');
  const msgForm = $('msgForm');
  const msgInput = $('msgInput');
  const usersList = $('users');
  const countEl = $('count');
  const msgCountEl = $('msgCount');
  const onlineCountEl = $('onlineCount');
  const myNameEl = $('myName');
  const typingEl = $('typing');
  const connectionStatus = $('connectionStatus');

  // ===== STATE =====
  var ws = null;
  var myId = null;
  var myUsername = '';
  var myColor = '';
  var isTyping = false;
  var typingTimeout = null;
  var typingUsers = {};
  var messageCount = 0;
  var isConnected = false;

  // ===== COLORS =====
  const userColors = [
    '#e94560', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  function getRandomColor() {
    return userColors[Math.floor(Math.random() * userColors.length)];
  }

  // ===== WEBSOCKET CONNECTION =====
  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}`;
    
    console.log('Connecting to:', wsUrl);
    updateConnectionStatus('connecting');
    ws = new WebSocket(wsUrl);

    ws.onopen = function() {
      console.log('✅ Connected to server');
      isConnected = true;
      updateConnectionStatus('connected');
    };

    ws.onmessage = function(event) {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    ws.onclose = function() {
      console.log('❌ Disconnected from server');
      isConnected = false;
      updateConnectionStatus('disconnected');
      addSysMsg('⚠️ Connection lost. Reconnecting in 3 seconds...');
      setTimeout(connect, 3000);
    };

    ws.onerror = function(error) {
      console.error('WebSocket error:', error);
      isConnected = false;
      updateConnectionStatus('error');
    };
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

  // ===== SEND MESSAGE =====
  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // ===== HANDLE INCOMING MESSAGES =====
  function handleMessage(data) {
    switch (data.type) {
      case 'welcome':
        myId = data.id;
        myColor = data.color || getRandomColor();
        console.log('My ID:', myId, 'Color:', myColor);
        break;

      case 'user_joined':
        if (data.id !== myId) {
          addSysMsg('✨ ' + escapeHtml(data.username) + ' joined the chat');
        }
        updateUsers(data.users);
        break;

      case 'user_left':
        addSysMsg('👋 ' + escapeHtml(data.username) + ' left the chat');
        delete typingUsers[data.id];
        updateUsers(data.users);
        updateTyping();
        break;

      case 'message':
        addMsg(data);
        messageCount++;
        updateMessageCount();
        delete typingUsers[data.id];
        updateTyping();
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

  function addMsg(data) {
    const own = data.id === myId;
    const div = document.createElement('div');
    div.className = 'msg ' + (own ? 'own' : 'other');

    const time = new Date(data.timestamp);
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = 
      '<div class="avatar" style="background:' + (data.color || '#666') + '">' + (data.username[0] || '?').toUpperCase() + '</div>' +
      '<div class="msg-body">' +
        '<div class="msg-head">' +
          '<span class="msg-name">' + escapeHtml(data.username) + '</span>' +
          '<span class="msg-time">' + timeStr + '</span>' +
        '</div>' +
        '<div class="bubble">' + escapeHtml(data.text) + '</div>' +
      '</div>';

    msgs.appendChild(div);
    scrollToBottom();
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function scrollToBottom() {
    setTimeout(function() {
      msgsWrap.scrollTop = msgsWrap.scrollHeight;
    }, 50);
  }

  function updateUsers(users) {
    // Keep the title
    const titleHtml = '<p class="users-title">Online Now</p>';
    
    // Clear and rebuild users list
    usersList.innerHTML = titleHtml;
    countEl.textContent = users.length;
    onlineCountEl.textContent = users.length;

    users.forEach(function(user) {
      const isMe = user.id === myId;
      const li = document.createElement('li');
      li.className = 'user';
      li.innerHTML = 
        '<span class="user-status"></span>' +
        '<div class="avatar" style="background:' + (user.color || '#666') + '">' + (user.username[0] || '?').toUpperCase() + '</div>' +
        '<div class="user-info">' +
          '<div class="user-name' + (isMe ? ' you' : '') + '">' + escapeHtml(user.username) + (isMe ? ' (You)' : '') + '</div>' +
          '<div class="user-status-text">' + (isMe ? 'That\'s you' : 'Online') + '</div>' +
        '</div>';
      usersList.appendChild(li);
    });
  }

  function updateTyping() {
    const names = Object.keys(typingUsers).map(id => typingUsers[id]).filter(name => name !== myUsername);
    
    if (names.length === 0) {
      typingEl.innerHTML = '';
    } else if (names.length === 1) {
      typingEl.innerHTML = escapeHtml(names[0]) + ' is typing<span class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
    } else if (names.length === 2) {
      typingEl.innerHTML = escapeHtml(names[0]) + ' and ' + escapeHtml(names[1]) + ' are typing<span class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
    } else {
      typingEl.innerHTML = names.length + ' people are typing<span class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
    }
  }

  function updateMessageCount() {
    if (msgCountEl) {
      msgCountEl.textContent = messageCount;
    }
  }

  // ===== SERVER STORAGE - Load chat history =====
  function loadChatHistory() {
    const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
    const apiUrl = `${protocol}//${location.host}/api/chat-history`;
    
    fetch(apiUrl)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.messages && data.messages.length > 0) {
          console.log('Loading ' + data.messages.length + ' messages from server');
          
          data.messages.forEach(function(msg) {
            addMsg(msg);
            messageCount++;
          });
          
          updateMessageCount();
          addSysMsg('📜 Welcome! Loaded ' + data.messages.length + ' previous messages');
        } else {
          addSysMsg('💬 Welcome to PoeVerse Chat! Start the conversation!');
        }
      })
      .catch(function(error) {
        console.error('Failed to load chat history:', error);
        addSysMsg('💬 Welcome to PoeVerse Chat! Start the conversation!');
      });
  }

  // ===== EVENT HANDLERS =====
  joinForm.onsubmit = function(e) {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    if (!name || name.length < 2) {
      alert('Please enter a username (at least 2 characters)');
      return;
    }

    myUsername = name;
    myColor = getRandomColor();

    // Show chat interface
    modal.classList.add('hidden');
    chat.classList.remove('hidden');

    // Load chat history from server
    loadChatHistory();

    // Focus on message input
    msgInput.focus();

    // Send join message to server
    send({ type: 'join', username: myUsername, color: myColor });
  };

  msgForm.onsubmit = function(e) {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;

    // Send message to server
    send({ type: 'message', text: text, color: myColor });

    // Clear input
    msgInput.value = '';
    msgInput.style.height = 'auto';

    // Stop typing indicator
    if (isTyping) {
      isTyping = false;
      send({ type: 'typing', isTyping: false });
    }
    clearTimeout(typingTimeout);
  };

  // Auto-resize textarea
  msgInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    
    // Send typing indicator
    if (!isTyping) {
      isTyping = true;
      send({ type: 'typing', isTyping: true });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(function() {
      isTyping = false;
      send({ type: 'typing', isTyping: false });
    }, 2000);
  });

  // Handle Enter key (shift+enter for new line)
  msgInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      msgForm.dispatchEvent(new Event('submit'));
    }
  });

  // ===== INITIALIZE =====
  connect();
  nameInput.focus();

})();
