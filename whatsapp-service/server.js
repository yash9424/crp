const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'default-key';

app.use(cors());
app.use(express.json());

let client;
let qrString = '';
let isReady = false;
const messageQueue = [];
let isProcessing = false;

// Initialize WhatsApp client
const initializeClient = () => {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', (qr) => {
    qrString = qr;
    console.log('QR Code generated');
  });

  client.on('ready', () => {
    isReady = true;
    console.log('WhatsApp client is ready!');
  });

  client.on('disconnected', () => {
    isReady = false;
    console.log('WhatsApp client disconnected');
  });

  client.initialize();
};

// API Key middleware
const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Process message queue
const processQueue = async () => {
  if (isProcessing || messageQueue.length === 0 || !isReady) return;
  
  isProcessing = true;
  const { phone, message, resolve, reject } = messageQueue.shift();
  
  try {
    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    await client.sendMessage(chatId, message);
    resolve({ success: true });
  } catch (error) {
    reject({ error: error.message });
  }
  
  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, 1500); // 1.5s delay between messages
};

// Routes
app.get('/qr', async (req, res) => {
  if (!qrString) {
    return res.status(400).json({ error: 'QR code not available' });
  }
  
  try {
    const qrImage = await qrcode.toDataURL(qrString);
    res.json({ qr: qrImage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.get('/status', (req, res) => {
  res.json({ 
    ready: isReady, 
    queueLength: messageQueue.length,
    hasQR: !!qrString 
  });
});

app.post('/send-message', authenticateAPI, (req, res) => {
  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message are required' });
  }
  
  if (!isReady) {
    return res.status(503).json({ error: 'WhatsApp client not ready' });
  }
  
  const promise = new Promise((resolve, reject) => {
    messageQueue.push({ phone, message, resolve, reject });
    processQueue();
  });
  
  promise
    .then(result => res.json(result))
    .catch(error => res.status(500).json(error));
});

app.post('/logout', authenticateAPI, async (req, res) => {
  try {
    if (client) {
      await client.logout();
      isReady = false;
      qrString = '';
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Serve QR viewer page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/qr-viewer.html');
});

app.listen(PORT, () => {
  console.log(`WhatsApp service running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to scan QR code`);
  initializeClient();
});