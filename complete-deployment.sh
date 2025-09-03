#!/bin/bash

# Script to complete the deployment on the live server
# This script should be run on the live server

echo "🚀 Completing deployment on live server..."

# Navigate to application directory
cd /var/www/fellowship-app

echo "📁 Current directory: $(pwd)"

# Move the OTP route file to the correct location
echo "📤 Moving OTP route file..."
sudo cp ~/otp-route.ts app/api/auth/otp/route.ts
sudo chown www-data:www-data app/api/auth/otp/route.ts

# Stop the application
echo "⏹️ Stopping application..."
pm2 stop fellowship-app

# Update environment variables
echo "🔧 Updating environment variables..."
cat > .env << EOL
# Database connection string for PostgreSQL
DATABASE_URL="postgresql://fellowship_user:Moh@2024!@localhost:5432/fellowship_db?schema=public"
DATABASE_URL_AUTHENTICATED="postgresql://fellowship_user:Moh@2024!@localhost:5432/fellowship_db?schema=public"

# App settings
NEXT_PUBLIC_APP_NAME="Affiliates Fellowship Program"
NEXT_PUBLIC_APP_URL="http://197.243.28.38"

# Admin credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="adminpass123"

# User login credentials
USER_EMAIL="techdev925@gmail.com"
USER_PASSWORD="Admin@2027\$"

# Email configuration - Updated for live server
EMAIL_HOST="mail.moh.gov.rw"
EMAIL_PORT="587"
EMAIL_USER="noreply"
EMAIL_PASSWORD="Moh@2024!"
EMAIL_FROM="MoH Affiliate Fellowship Program <noreply@moh.gov.rw>"
EMAIL_SECURE="false"
EMAIL_CONTACT="fellowship@moh.gov.rw"

# JWT Secret
JWT_SECRET="fellowship-program-jwt-secret-live-2025"

# Node Environment
NODE_ENV="production"
EOL

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🏗️ Building application..."
npm run build

# Start the application
echo "🚀 Starting application..."
pm2 start ecosystem.config.js

# Check application status
echo "📊 Application status:"
pm2 status

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Test the application at: http://197.243.28.38/login"
echo "📋 Check logs with: pm2 logs fellowship-app"
echo ""
echo "🧪 Test the login flow:"
echo "1. Go to http://197.243.28.38/login"
echo "2. Enter email: techdev925@gmail.com"
echo "3. Enter password: admin123"
echo "4. Check for OTP email"
echo "5. Enter OTP code"
echo "6. Verify redirection to admin dashboard"
