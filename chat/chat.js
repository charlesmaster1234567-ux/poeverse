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
    const myNameEl = $('myName');
    const typingEl = $('typing');
  
    // ===== STATE =====
    let ws = null;
    let myId = null;
    let myUsername = '';
    let myColor = '';
    let isTyping = false;
    let typingTimeout = null;
    let typingUsers = {};
  
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
  
    function addMsg(data) {
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
  
    // ===== EVENT HANDLERS =====
    joinForm.onsubmit = (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) return;
  
      myUsername = name;
  
      modal.classList.add('hidden');
      chat.classList.remove('hidden');
      myNameEl.textContent = myUsername;
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