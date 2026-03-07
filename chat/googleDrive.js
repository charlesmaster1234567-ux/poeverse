// Google Drive Storage - 100% FREE
const DriveStorage = {
  CLIENT_ID: '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.apps.googleusercontent.com',
  API_KEY: 'AIzaSyBEkALi31VmN_NMoIMAK7fEmqBmJDIWMLA',
  SCOPES: 'https://www.googleapis.com/auth/drive.file',
  
  fileId: null,
  isReady: false,

  // Initialize
  async init() {
    return new Promise((resolve) => {
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: this.API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        
        google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES,
          callback: async (response) => {
            if (response.error) {
              console.error('Auth error:', response);
              return;
            }
            this.isReady = true;
            await this.findOrCreateFile();
            resolve();
          },
        }).requestAccessToken();
      });
    });
  },

  // Find or create chat file
  async findOrCreateFile() {
    try {
      // Search for existing file
      const response = await gapi.client.drive.files.list({
        q: "name='poeverse_chat.json' and trashed=false",
        fields: 'files(id, name)',
      });

      if (response.result.files.length > 0) {
        this.fileId = response.result.files[0].id;
        console.log('📂 Found chat file:', this.fileId);
      } else {
        // Create new file
        const file = await gapi.client.drive.files.create({
          resource: { name: 'poeverse_chat.json' },
          fields: 'id',
        });
        this.fileId = file.result.id;
        
        // Initialize with empty messages
        await this.saveMessages([]);
        console.log('✅ Created new chat file:', this.fileId);
      }
    } catch (err) {
      console.error('Error with file:', err);
    }
  },

  // Load messages
  async loadMessages() {
    if (!this.fileId) return [];
    
    try {
      const response = await gapi.client.drive.files.get({
        fileId: this.fileId,
        alt: 'media',
      });

      const data = JSON.parse(response.body || '{"messages":[]}');
      console.log(`📥 Loaded ${data.messages.length} messages`);
      return data.messages;
    } catch (err) {
      console.error('Error loading:', err);
      return [];
    }
  },

  // Save messages
  async saveMessages(messages) {
    if (!this.fileId) return false;

    const content = JSON.stringify({
      messages: messages,
      updated: new Date().toISOString()
    });

    try {
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
            'Content-Type': 'application/json',
          },
          body: content,
        }
      );
      console.log('💾 Saved to Drive');
      return true;
    } catch (err) {
      console.error('Save error:', err);
      return false;
    }
  },

  // Add single message
  async addMessage(message) {
    const messages = await this.loadMessages();
    messages.push(message);
    
    // Keep only last 1000 messages
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }
    
    await this.saveMessages(messages);
  }
};