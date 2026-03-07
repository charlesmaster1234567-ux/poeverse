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

  // ===== STATE =====
  let ws = null;
  let myId = null;
  let myUsername = '';
  let myColor = '';
  let isTyping = false;
  let typingTimeout = null;
  let typingUsers = {};
  let useDrive = false;
  let messageHistory = [];

  // ===== WEBSOCKET CONNECTION =====
  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}`;
    
    console.log('Connecting to:', wsUrl);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Connected to server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    ws.onclose = () => {
      console.log('❌ Disconnected from server');
      addSysMsg('⚠️ Connection lost. Refresh to reconnect.');
    };

    ws.onerror = (error) => {
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
          addSysMsg(`${data.username} joined the chat`);
        }
        updateUsers(data.users);
        break;

      case 'user_left':
        addSysMsg(`${data.username} left the chat`);
        delete typingUsers[data.id];
        updateUsers(data.users);
        updateTyping();
        break;

      case 'message':
        addMsg(data);
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

  function addMsg(data, shouldSave = true) {
    const own = data.id === myId;
    const div = document.createElement('div');
    div.className = `msg ${own ? 'own' : 'other'}`;

    const time = new Date(data.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    div.innerHTML = `
      <div class="avatar" style="background:${data.color}">${data.username[0].toUpperCase()}</div>
      <div class="msg-body">
        <div class="msg-head">
          <span class="msg-name" style="color:${data.color}">${data.username}</span>
          <span class="msg-time">${time}</span>
        </div>
        <div class="bubble">${escapeHtml(data.text)}</div>
      </div>
    `;

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
    setTimeout(() => {
      msgsWrap.scrollTop = msgsWrap.scrollHeight;
    }, 0);
  }

  function updateUsers(users) {
    usersList.innerHTML = '';
    countEl.textContent = users.length;

    users.forEach(user => {
      const isMe = user.id === myId;
      const li = document.createElement('li');
      li.className = 'user';
      li.innerHTML = `
        <div class="avatar" style="background:${user.color}">${user.username[0].toUpperCase()}</div>
        <span class="uname ${isMe ? 'you' : ''}">${user.username}${isMe ? ' (You)' : ''}</span>
      `;
      usersList.appendChild(li);
    });
  }

  function updateTyping() {
    const names = Object.values(typingUsers);
    if (names.length === 0) {
      typingEl.textContent = '';
    } else if (names.length === 1) {
      typingEl.textContent = `${names[0]} is typing...`;
    } else {
      typingEl.textContent = `${names.length} people are typing...`;
    }
  }

  // ===== GOOGLE DRIVE FUNCTIONS =====
  function updateDriveStatus(status, text) {
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

  async function saveToDrive(message) {
    if (!useDrive || !DriveStorage.isReady) return;

    try {
      updateDriveStatus('syncing', 'Syncing...');
      await DriveStorage.appendMessage(message);
      updateDriveStatus('connected', 'Drive: Saved');
      
      // Reset to "Connected" after 2 seconds
      setTimeout(() => {
        updateDriveStatus('connected', 'Drive: Connected');
      }, 2000);
    } catch (error) {
      console.error('Failed to save to Drive:', error);
      updateDriveStatus('error', 'Drive: Error');
    }
  }

  async function loadFromDrive() {
    if (!useDrive || !DriveStorage.isReady) return;

    try {
      updateDriveStatus('syncing', 'Loading history...');
      const messages = await DriveStorage.loadMessages();
      
      console.log(`Loading ${messages.length} messages from Drive`);
      
      messages.forEach(msg => {
        addMsg(msg, false); // Display but don't re-save
      });

      if (messages.length > 0) {
        addSysMsg(`📁 Loaded ${messages.length} messages from Drive`);
      }

      updateDriveStatus('connected', 'Drive: Connected');
    } catch (error) {
      console.error('Failed to load from Drive:', error);
      addSysMsg('⚠️ Failed to load Drive history');
      updateDriveStatus('error', 'Drive: Error');
    }
  }

  async function initializeDrive() {
    try {
      updateDriveStatus('syncing', 'Connecting to Drive...');
      
      await DriveStorage.init();
      await DriveStorage.authenticate();
      
      useDrive = true;
      await loadFromDrive();
      
      console.log('✅ Google Drive storage enabled');
    } catch (error) {
      console.error('Drive initialization failed:', error);
      addSysMsg('❌ Failed to connect to Google Drive');
      updateDriveStatus('error', 'Drive: Failed');
      useDrive = false;
    }
  }

  // ===== EVENT HANDLERS =====
  joinForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;

    myUsername = name;
    const wantsDrive = driveToggle.checked;

    // Show chat interface
    modal.classList.add('hidden');
    chat.classList.remove('hidden');
    myNameEl.textContent = myUsername;

    // Initialize Google Drive if requested
    if (wantsDrive) {
      await initializeDrive();
    }

    msgInput.focus();

    // Send join message to server
    send({ type: 'join', username: myUsername });
  };

  msgForm.onsubmit = (e) => {
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

  msgInput.oninput = () => {
    if (!isTyping) {
      isTyping = true;
      send({ type: 'typing', isTyping: true });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      send({ type: 'typing', isTyping: false });
    }, 2000);
  };

  // ===== INITIALIZE =====
  connect();
  nameInput.focus();

})();