# WhatsApp Service Setup

## Installation

1. Navigate to whatsapp-service directory:
```bash
cd whatsapp-service
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```bash
copy .env.example .env
```

4. Update .env with your settings:
```
PORT=3001
API_KEY=your-secret-api-key-here
NODE_ENV=development
```

## Development

Start the service:
```bash
npm run dev
```

## Production with PM2

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the service:
```bash
pm2 start ecosystem.config.js
```

3. Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

## Usage

1. Start the service and visit http://localhost:3002/qr to scan QR code
2. Once authenticated, the service will stay connected
3. Your Next.js app can now send messages via /api/send-bill

## API Endpoints

- GET /qr - Get QR code for WhatsApp authentication
- GET /status - Check service status
- POST /send-message - Send WhatsApp message (requires API key)

## Environment Variables

Add to your Next.js .env.local:
```
WHATSAPP_API_KEY=your-secret-api-key-here
```