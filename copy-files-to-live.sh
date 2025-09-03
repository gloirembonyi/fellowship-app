#!/bin/bash

# Simple script to copy updated files to live server
# Run this from your local machine

echo "🚀 Copying updated files to live server..."

# Server configuration
SERVER_IP="197.243.28.38"
SERVER_PORT="5645"
SERVER_USER="gloire"
APP_DIR="/var/www/fellowship-app"

echo "📤 Copying login page..."
scp -P $SERVER_PORT app/login/page.tsx $SERVER_USER@$SERVER_IP:$APP_DIR/app/login/

echo "📤 Copying OTP API..."
scp -P $SERVER_PORT app/api/auth/otp/route.ts $SERVER_USER@$SERVER_IP:$APP_DIR/app/api/auth/otp/

echo "📤 Copying email service..."
scp -P $SERVER_PORT lib/emailService.ts $SERVER_USER@$SERVER_IP:$APP_DIR/lib/

echo "📤 Copying middleware..."
scp -P $SERVER_PORT middleware.ts $SERVER_USER@$SERVER_IP:$APP_DIR/

echo "✅ Files copied successfully!"
echo ""
echo "🔧 Next steps on the server:"
echo "1. SSH to server: ssh -p 5645 gloire@197.243.28.38"
echo "2. Navigate to app: cd /var/www/fellowship-app"
echo "3. Stop app: pm2 stop fellowship-app"
echo "4. Build app: npm run build"
echo "5. Start app: pm2 start ecosystem.config.js"
echo "6. Check logs: pm2 logs fellowship-app"
echo ""
echo "🌐 Test the application at: http://197.243.28.38/login"
