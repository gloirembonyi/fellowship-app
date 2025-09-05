#!/bin/bash

echo "🚀 Completing fellowship-app deployment..."

# Server configuration
SERVER_IP="197.243.28.38"
SERVER_PORT="5645"
SERVER_USER="gloire"
APP_DIR="/var/www/fellowship-app"

echo "📝 Step 1: Setting up environment variables..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
    cd $APP_DIR
    cat > .env << 'EOL'
# Database connection string for SQLite
DATABASE_URL=\"file:./dev.db\"
DATABASE_URL_AUTHENTICATED=\"file:./dev.db\"

# App settings
NEXT_PUBLIC_APP_NAME=\"Affiliates Fellowship Program\"
NEXT_PUBLIC_APP_URL=\"http://197.243.28.38:4000\"

# Admin credentials
ADMIN_USERNAME=\"admin\"
ADMIN_PASSWORD=\"adminpass123\"

# User login credentials
USER_EMAIL=\"techdev925@gmail.com\"
USER_PASSWORD=\"Admin@2027\$\"

# Email configuration
EMAIL_HOST=\"mail.moh.gov.rw\"
EMAIL_PORT=\"587\"
EMAIL_USER=\"noreply\"
EMAIL_PASSWORD=\"Moh@2024!\"
EMAIL_FROM=\"MoH Affiliate Fellowship Program <noreply@moh.gov.rw>\"
EMAIL_SECURE=\"false\"
EMAIL_CONTACT=\"fellowship@moh.gov.rw\"

# JWT Secret
JWT_SECRET=\"fellowship-program-jwt-secret-live-2025\"

# Node Environment
NODE_ENV=\"production\"
EOL
"

echo "🔧 Step 2: Starting application with PM2..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
    cd $APP_DIR
    echo 'Stopping any existing application...'
    pm2 stop fellowship-app 2>/dev/null || true
    pm2 delete fellowship-app 2>/dev/null || true
    
    echo 'Starting application...'
    pm2 start ecosystem.config.js
    
    echo 'Checking status...'
    pm2 status
"

echo "⏳ Step 3: Waiting for application to start..."
sleep 10

echo "🧪 Step 4: Testing deployment..."
if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP:4000" | grep -q "200"; then
    echo "✅ SUCCESS! Application is live and accessible at http://$SERVER_IP:4000"
else
    echo "❌ Application not accessible. Checking logs..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "cd $APP_DIR && pm2 logs fellowship-app --lines 20"
fi

echo "🎉 Deployment completed!"
echo ""
echo "📋 Summary:"
echo "✅ Environment variables configured"
echo "✅ Application started with PM2"
echo "✅ Running on port 4000"
echo ""
echo "🌐 Access your application at: http://$SERVER_IP:4000"
echo "🔧 Check logs: ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'cd $APP_DIR && pm2 logs fellowship-app'"
echo "📊 Check status: ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'cd $APP_DIR && pm2 status'"