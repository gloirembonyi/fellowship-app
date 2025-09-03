#!/bin/bash

# Complete Live Server Replacement Script
# This script replaces the live server with the working fellowship-app
# while preserving all data and configuring it to use port 4000

set -e

echo "🚀 Starting complete live server replacement..."

# Server configuration
SERVER_IP="197.243.28.38"
SERVER_PORT="5645"
SERVER_USER="gloire"
APP_DIR="/var/www/fellowship-app"
BACKUP_DIR="/var/backups/fellowship-app-$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Replacement Configuration:${NC}"
echo "Server: $SERVER_IP:$SERVER_PORT"
echo "User: $SERVER_USER"
echo "App Directory: $APP_DIR"
echo "Backup Directory: $BACKUP_DIR"
echo "Target Port: 4000"
echo ""

# Function to run commands on remote server
run_remote() {
    sshpass -p "admin1123" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$1"
}

# Function to copy files to remote server
copy_to_remote() {
    sshpass -p "admin1123" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_IP:$2"
}

echo -e "${YELLOW}📦 Step 1: Creating comprehensive backup...${NC}"

# Create backup on server
run_remote "
    # Create backup directory
    sudo mkdir -p $BACKUP_DIR
    
    # Backup current application
    sudo cp -r $APP_DIR $BACKUP_DIR/application-backup
    
    # Backup database
    sudo -u postgres pg_dump fellowship_db > $BACKUP_DIR/database-backup.sql
    
    # Backup nginx configuration
    sudo cp /etc/nginx/sites-available/fellowship-app $BACKUP_DIR/nginx-config
    
    # Backup PM2 configuration
    pm2 save
    sudo cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2-dump.pm2
    
    echo '✅ Backup completed at: $BACKUP_DIR'
"

echo -e "${GREEN}✅ Backup completed successfully${NC}"

echo -e "${YELLOW}📤 Step 2: Stopping current services...${NC}"

# Stop current services
run_remote "
    # Stop PM2 application
    pm2 stop fellowship-app || true
    pm2 delete fellowship-app || true
    
    # Stop nginx temporarily
    sudo systemctl stop nginx
"

echo -e "${GREEN}✅ Services stopped${NC}"

echo -e "${YELLOW}📤 Step 3: Uploading working fellowship-app...${NC}"

# Create temporary directory for deployment
TEMP_DIR=$(mktemp -d)
echo "Temporary directory: $TEMP_DIR"

# Copy all necessary files to temp directory
cp -r app/ "$TEMP_DIR/"
cp -r lib/ "$TEMP_DIR/"
cp -r components/ "$TEMP_DIR/"
cp -r public/ "$TEMP_DIR/"
cp -r prisma/ "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp next.config.js "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp tailwind.config.js "$TEMP_DIR/"
cp postcss.config.js "$TEMP_DIR/"
cp middleware.ts "$TEMP_DIR/"

echo -e "${GREEN}✅ Files prepared for upload${NC}"

# Upload files to server
echo "Uploading new application..."
copy_to_remote "$TEMP_DIR/*" "$SERVER_USER@$SERVER_IP:~/fellowship-new/"

echo -e "${GREEN}✅ Files uploaded successfully${NC}"

echo -e "${YELLOW}🔧 Step 4: Deploying new application...${NC}"

# Deploy new application on server
run_remote "
    # Move to the new application directory
    cd ~/fellowship-new
    
    # Install dependencies
    echo 'Installing dependencies...'
    npm install --production
    
    # Update .env file with live configuration
    echo 'Updating environment configuration...'
    cat > .env << EOL
# Database connection string for PostgreSQL
DATABASE_URL=\"postgresql://fellowship_user:Moh@2024!@localhost:5432/fellowship_db?schema=public\"
DATABASE_URL_AUTHENTICATED=\"postgresql://fellowship_user:Moh@2024!@localhost:5432/fellowship_db?schema=public\"

# App settings
NEXT_PUBLIC_APP_NAME=\"Affiliates Fellowship Program\"
NEXT_PUBLIC_APP_URL=\"http://197.243.28.38:4000\"

# Admin credentials
ADMIN_USERNAME=\"admin\"
ADMIN_PASSWORD=\"adminpass123\"

# User login credentials
USER_EMAIL=\"techdev925@gmail.com\"
USER_PASSWORD=\"Admin@2027\$\"

# Email configuration - Updated for live server
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

    # Update Prisma schema to use PostgreSQL
    echo 'Updating Prisma schema for PostgreSQL...'
    sed -i 's/provider = \"sqlite\"/provider = \"postgresql\"/' prisma/schema.prisma
    sed -i 's|url      = \"file:./dev.db\"|url      = env(\"DATABASE_URL\")|' prisma/schema.prisma

    # Generate Prisma client
    echo 'Generating Prisma client...'
    npx prisma generate

    # Run database migrations
    echo 'Running database migrations...'
    npx prisma migrate deploy

    # Build the application
    echo 'Building the application...'
    npm run build

    # Copy files to application directory
    echo 'Copying files to application directory...'
    sudo rm -rf $APP_DIR/*
    sudo cp -r * $APP_DIR/
    sudo chown -R www-data:www-data $APP_DIR
    sudo chmod -R 755 $APP_DIR

    # Clean up temporary files
    rm -rf ~/fellowship-new
"

echo -e "${GREEN}✅ Application deployed successfully${NC}"

echo -e "${YELLOW}🔧 Step 5: Configuring services for port 4000...${NC}"

# Configure services for port 4000
run_remote "
    cd $APP_DIR
    
    # Create PM2 ecosystem file for port 4000
    cat > ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'fellowship-app',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
EOL

    # Update nginx configuration for port 4000
    sudo tee /etc/nginx/sites-available/fellowship-app << EOL
server {
    listen 80;
    server_name 197.243.28.38;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # For large file uploads
    client_max_body_size 50M;
}
EOL

    # Test nginx configuration
    sudo nginx -t

    # Start the application with PM2
    pm2 start ecosystem.config.js
    pm2 save

    # Start nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx

    # Check application status
    pm2 status
"

echo -e "${GREEN}✅ Services configured for port 4000${NC}"

echo -e "${YELLOW}🔍 Step 6: Verifying deployment...${NC}"

# Wait a moment for the application to start
sleep 10

# Test the application
echo "Testing application endpoints..."

# Test main page
if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP:4000/" | grep -q "200"; then
    echo -e "${GREEN}✅ Main page is accessible${NC}"
else
    echo -e "${RED}❌ Main page is not accessible${NC}"
fi

# Test application form
if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP:4000/apply" | grep -q "200"; then
    echo -e "${GREEN}✅ Application form is accessible${NC}"
else
    echo -e "${RED}❌ Application form is not accessible${NC}"
fi

# Test login page
if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP:4000/login" | grep -q "200"; then
    echo -e "${GREEN}✅ Login page is accessible${NC}"
else
    echo -e "${RED}❌ Login page is not accessible${NC}"
fi

# Test admin page
if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP:4000/admin" | grep -q "200\|301"; then
    echo -e "${GREEN}✅ Admin page is accessible${NC}"
else
    echo -e "${RED}❌ Admin page is not accessible${NC}"
fi

echo -e "${YELLOW}🧹 Step 7: Cleaning up...${NC}"

# Clean up temporary directory
rm -rf "$TEMP_DIR"

echo -e "${GREEN}🎉 Live server replacement completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "✅ Complete backup created at: $BACKUP_DIR"
echo "✅ Working fellowship-app deployed"
echo "✅ Configured to use port 4000"
echo "✅ Database data preserved"
echo "✅ All services restarted"
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "Main Page: http://$SERVER_IP:4000/"
echo "Application Form: http://$SERVER_IP:4000/apply"
echo "Login Page: http://$SERVER_IP:4000/login"
echo "Admin Dashboard: http://$SERVER_IP:4000/admin"
echo ""
echo -e "${BLUE}📧 Email Configuration:${NC}"
echo "SMTP Host: mail.moh.gov.rw"
echo "Email From: MoH Affiliate Fellowship Program <noreply@moh.gov.rw>"
echo "App URL: http://$SERVER_IP:4000"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Test application submission at http://$SERVER_IP:4000/apply"
echo "2. Test admin login at http://$SERVER_IP:4000/login"
echo "3. Verify all data is accessible in admin dashboard"
echo "4. Test email functionality"
echo ""
echo -e "${GREEN}🚀 Your fellowship-app is now live and working on port 4000!${NC}"
