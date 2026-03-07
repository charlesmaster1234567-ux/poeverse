/**
 * Google Drive Storage for PoeVerse Chat
 * FREE - Uses Google Drive API (15GB free storage)
 */

const DriveStorage = {
  // ⚠️ REGENERATE THESE KEYS - The ones you posted are compromised!
  CLIENT_ID: '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.apps.googleusercontent.com',
  API_KEY: 'AIzaSyBgg9wPuu7FAJciFLbzJUZgkRSYY-6pY6k',
  
  // Constants
  SCOPES: 'https://www.googleapis.com/auth/drive.file',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  FILE_NAME: 'poeverse_chat_history.json',
  
  // State
  fileId: null,
  isReady: false,
  tokenClient: null,

  /**
   * Initialize Google APIs
   */
  async init() {
    try {
      // Load GAPI client
      await new Promise((resolve) => {
        gapi.load('client', resolve);
      });

      // Initialize GAPI client
      await gapi.client.init({
        apiKey: this.API_KEY,
        discoveryDocs: this.DISCOVERY_DOCS,
      });

      console.log('✅ Google API initialized');

      // Initialize token client
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.CLIENT_ID,
        scope: this.SCOPES,
        callback: '', // Will be set during authentication
      });

      console.log('✅ Token client ready');
      return true;
    } catch (error) {
      console.error('❌ Drive init failed:', error);
      throw error;
    }
  },

  /**
   * Authenticate user with Google
   */
  async authenticate() {
    return new Promise((resolve, reject) => {
      this.tokenClient.callback = async (response) => {
        if (response.error) {
          console.error('Auth error:', response);
          reject(response);
          return;
        }

        this.isReady = true;
        console.log('✅ Authenticated with Google');
        
        // Find or create file after authentication
        await this.findOrCreateFile();
        resolve();
      };

      // Check if we already have a token
      const token = gapi.client.getToken();
      if (token === null) {
        // Prompt for consent
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Skip consent if already granted
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  },

  /**
   * Find existing chat file or create new one
   */
  async findOrCreateFile() {
    try {
      // Search for existing file
      const response = await gapi.client.drive.files.list({
        q: `name='${this.FILE_NAME}' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name, createdTime)',
        pageSize: 1,
      });

      const files = response.result.files || [];

      if (files.length > 0) {
        this.fileId = files[0].id;
        console.log('📂 Found existing chat file:', this.fileId);
        return this.fileId;
      } else {
        // Create new file
        console.log('📄 Creating new chat file...');
        return await this.createFile();
      }
    } catch (error) {
      console.error('Error finding file:', error);
      throw error;
    }
  },

  /**
   * Create new chat history file in Drive
   */
  async createFile() {
    const metadata = {
      name: this.FILE_NAME,
      mimeType: 'application/json',
    };

    const initialData = {
      messages: [],
      created: new Date().toISOString(),
      appVersion: '1.0.0',
    };

    const file = new Blob([JSON.stringify(initialData, null, 2)], { 
      type: 'application/json' 
    });

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { 
      type: 'application/json' 
    }));
    form.append('file', file);

    try {
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: new Headers({ 
            Authorization: 'Bearer ' + gapi.client.getToken().access_token 
          }),
          body: form,
        }
      );

      const data = await response.json();
      this.fileId = data.id;
      console.log('✅ Created new chat file:', this.fileId);
      return this.fileId;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  },

  /**
   * Load all messages from Drive
   */
  async loadMessages() {
    if (!this.fileId) {
      console.warn('No file ID available');
      return [];
    }

    try {
      const response = await gapi.client.drive.files.get({
        fileId: this.fileId,
        alt: 'media',
      });

      const data = JSON.parse(response.body);
      const messages = data.messages || [];
      
      console.log(`📥 Loaded ${messages.length} messages from Drive`);
      return messages;
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  },

  /**
   * Save all messages to Drive
   */
  async saveMessages(messages) {
    if (!this.fileId) {
      console.warn('No file ID available');
      return false;
    }

    const data = {
      messages: messages,
      lastUpdated: new Date().toISOString(),
      messageCount: messages.length,
    };

    const content = JSON.stringify(data, null, 2);

    try {
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: new Headers({
            Authorization: 'Bearer ' + gapi.client.getToken().access_token,
            'Content-Type': 'application/json',
          }),
          body: content,
        }
      );

      if (response.ok) {
        console.log('💾 Saved to Drive');
        return true;
      } else {
        console.error('Save failed:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error saving messages:', error);
      return false;
    }
  },

  /**
   * Append a single message (loads, appends, saves)
   */
  async appendMessage(message) {
    try {
      const messages = await this.loadMessages();
      messages.push(message);

      // Keep only last 1000 messages to prevent file from getting too large
      const MAX_MESSAGES = 1000;
      if (messages.length > MAX_MESSAGES) {
        messages.splice(0, messages.length - MAX_MESSAGES);
      }

      await this.saveMessages(messages);
      return true;
    } catch (error) {
      console.error('Error appending message:', error);
      return false;
    }
  },

  /**
   * Clear all chat history
   */
  async clearHistory() {
    return await this.saveMessages([]);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.isReady && gapi.client.getToken() !== null;
  },

  /**
   * Sign out
   */
  signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
      this.isReady = false;
      this.fileId = null;
      console.log('👋 Signed out from Google Drive');
    }
  },
};