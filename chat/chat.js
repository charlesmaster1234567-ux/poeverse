(function() {
  'use strict';

  // ===== DOM ELEMENTS =====
  const $ = id => document.getElementById(id);
  const modal = $('modal');
  const joinForm = $('joinForm');
  const nameInput = $('nameInput');
  const driveToggle = $('driveToggle');
  const chat = $('chat');
  const msgs = $('msgs');
  const msgsWrap = $('msgsWrap');
  const msgForm = $('msgForm');
  const msgInput = $('msgInput');
  const usersList = $('users');
  const countEl = $('count');
  const myNameEl = $('myName');
  const typingEl = $('typing');
  const driveStatus = $('driveStatus');
  const driveIcon = $('driveIcon');
  const driveText = $('driveText');

  // ===== STATE (Must be defined before use!) =====
  var ws = null;
  var myId = null;
  var myUsername = '';  // <-- This must exist here!
  var myColor = '';
  var isTyping = false;
  var typingTimeout = null;
  var typingUsers = {};
  var useDrive = false;
  var messageHistory = [];

  // ===== WEBSOCKET CONNECTION =====
  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}`;
    
    console.log('Connecting to:', wsUrl);
    ws = new WebSocket(wsUrl);

    ws.onopen = function() {
      console.log('✅ Connected to server');
    };

    ws.onmessage = function(event) {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    ws.onclose = function() {
      console.log('❌ Disconnected from server');
      addSysMsg('⚠️ Connection lost. Refresh to reconnect.');
    };

    ws.onerror = function(error) {
      console.error('WebSocket error:', error);
    };
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
        myColor = data.color;
        console.log('My ID:', myId, 'Color:', myColor);
        break;

      case 'user_joined':
        if (data.id !== myId) {
          addSysMsg(data.username + ' joined the chat');
        }
        updateUsers(data.users);
        break;

      case 'user_left':
        addSysMsg(data.username + ' left the chat');
        delete typingUsers[data.id];
        updateUsers(data.users);
        updateTyping();
        break;

      case 'message':
        addMsg(data, true);
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
    scroll();
  }

  function addMsg(data, shouldSave) {
    const own = data.id === myId;
    const div = document.createElement('div');
    div.className = 'msg ' + (own ? 'own' : 'other');

    const time = new Date(data.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    div.innerHTML = 
      '<div class="avatar" style="background:' + data.color + '">' + data.username[0].toUpperCase() + '</div>' +
      '<div class="msg-body">' +
        '<div class="msg-head">' +
          '<span class="msg-name" style="color:' + data.color + '">' + data.username + '</span>' +
          '<span class="msg-time">' + time + '</span>' +
        '</div>' +
        '<div class="bubble">' + escapeHtml(data.text) + '</div>' +
      '</div>';

    msgs.appendChild(div);
    scroll();

    // Save to message history
    messageHistory.push(data);

    // Save to Google Drive if enabled
    if (shouldSave && useDrive) {
      saveToDrive(data);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function scroll() {
    setTimeout(function() {
      msgsWrap.scrollTop = msgsWrap.scrollHeight;
    }, 0);
  }

  function updateUsers(users) {
    usersList.innerHTML = '';
    countEl.textContent = users.length;

    users.forEach(function(user) {
      const isMe = user.id === myId;
      const li = document.createElement('li');
      li.className = 'user';
      li.innerHTML = 
        '<div class="avatar" style="background:' + user.color + '">' + user.username[0].toUpperCase() + '</div>' +
        '<span class="uname ' + (isMe ? 'you' : '') + '">' + user.username + (isMe ? ' (You)' : '') + '</span>';
      usersList.appendChild(li);
    });
  }

  function updateTyping() {
    const names = Object.values(typingUsers);
    if (names.length === 0) {
      typingEl.textContent = '';
    } else if (names.length === 1) {
      typingEl.textContent = names[0] + ' is typing...';
    } else {
      typingEl.textContent = names.length + ' people are typing...';
    }
  }

  // ===== SERVER STORAGE FUNCTIONS =====
  // Load chat history from server
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
            addMsg(msg, false);
          });
          
          addSysMsg('📜 Loaded ' + data.messages.length + ' previous messages');
        }
      })
      .catch(function(error) {
        console.error('Failed to load chat history:', error);
      });
  }
  function updateDriveStatus(status, text) {
    if (!driveStatus) return;
    
    driveStatus.classList.remove('hidden');
    driveText.textContent = text;

    if (status === 'syncing') {
      driveIcon.textContent = '🔄';
      driveStatus.classList.remove('connected');
      driveStatus.classList.add('syncing');
    } else if (status === 'connected') {
      driveIcon.textContent = '✅';
      driveStatus.classList.add('connected');
      driveStatus.classList.remove('syncing');
    } else if (status === 'error') {
      driveIcon.textContent = '❌';
      driveStatus.classList.remove('connected', 'syncing');
    }
  }

  function saveToDrive(message) {
    if (!useDrive || typeof DriveStorage === 'undefined' || !DriveStorage.isReady) return;

    updateDriveStatus('syncing', 'Syncing...');
    
    DriveStorage.appendMessage(message)
      .then(function() {
        updateDriveStatus('connected', 'Drive: Saved');
        setTimeout(function() {
          updateDriveStatus('connected', 'Drive: Connected');
        }, 2000);
      })
      .catch(function(error) {
        console.error('Failed to save to Drive:', error);
        updateDriveStatus('error', 'Drive: Error');
      });
  }

  function loadFromDrive() {
    if (!useDrive || typeof DriveStorage === 'undefined' || !DriveStorage.isReady) return;

    updateDriveStatus('syncing', 'Loading history...');
    
    DriveStorage.loadMessages()
      .then(function(messages) {
        console.log('Loading ' + messages.length + ' messages from Drive');
        
        messages.forEach(function(msg) {
          addMsg(msg, false);
        });

        if (messages.length > 0) {
          addSysMsg('📁 Loaded ' + messages.length + ' messages from Drive');
        }

        updateDriveStatus('connected', 'Drive: Connected');
      })
      .catch(function(error) {
        console.error('Failed to load from Drive:', error);
        addSysMsg('⚠️ Failed to load Drive history');
        updateDriveStatus('error', 'Drive: Error');
      });
  }

  function initializeDrive() {
    if (typeof DriveStorage === 'undefined') {
      console.error('DriveStorage not found');
      addSysMsg('⚠️ Google Drive not available');
      return;
    }

    updateDriveStatus('syncing', 'Connecting to Drive...');
    
    DriveStorage.init()
      .then(function() {
        return DriveStorage.authenticate();
      })
      .then(function() {
        useDrive = true;
        loadFromDrive();
        console.log('✅ Google Drive storage enabled');
      })
      .catch(function(error) {
        console.error('Drive initialization failed:', error);
        addSysMsg('❌ Failed to connect to Google Drive');
        updateDriveStatus('error', 'Drive: Failed');
        useDrive = false;
      });
  }

  // ===== EVENT HANDLERS =====
  joinForm.onsubmit = function(e) {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    if (!name) return;

    // Set username FIRST
    myUsername = name;
    
    const wantsDrive = driveToggle && driveToggle.checked;

    // Show chat interface
    modal.classList.add('hidden');
    chat.classList.remove('hidden');
    myNameEl.textContent = myUsername;

    // Load chat history from server
    loadChatHistory();

    // Initialize Google Drive if requested (legacy - no longer needed)
    if (wantsDrive) {
      // Google Drive is deprecated - history now loads from server automatically
      addSysMsg('💡 Chat history is now saved automatically on the server');
    }

    msgInput.focus();

    // Send join message to server
    send({ type: 'join', username: myUsername });
  };

  msgForm.onsubmit = function(e) {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;

    // Send message to server
    send({ type: 'message', text: text });

    msgInput.value = '';

    // Stop typing indicator
    if (isTyping) {
      isTyping = false;
      send({ type: 'typing', isTyping: false });
    }
    clearTimeout(typingTimeout);
  };

  msgInput.oninput = function() {
    if (!isTyping) {
      isTyping = true;
      send({ type: 'typing', isTyping: true });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(function() {
      isTyping = false;
      send({ type: 'typing', isTyping: false });
    }, 2000);
  };

  // ===== INITIALIZE =====
  connect();
  nameInput.focus();

})();