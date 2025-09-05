# Manual Live Server Replacement Guide

This guide will help you replace the live server with your working fellowship-app while preserving all data and configuring it to use port 4000.

## 🚀 Step-by-Step Instructions

### Step 1: Connect to Live Server
```bash
ssh -p 5645 gloire@197.243.28.38
# Password: admin1123
```

### Step 2: Create Backup (Prevent Data Loss)
```bash
# Create backup directory
sudo mkdir -p /var/backups/fellowship-app-$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/fellowship-app-$(date +%Y%m%d_%H%M%S)"

# Backup current application
sudo cp -r /var/www/fellowship-app $BACKUP_DIR/application-backup

# Backup database
sudo -u postgres pg_dump fellowship_db > $BACKUP_DIR/database-backup.sql

# Backup nginx configuration
sudo cp /etc/nginx/sites-available/fellowship-app $BACKUP_DIR/nginx-config

# Backup PM2 configuration
pm2 save
sudo cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2-dump.pm2

echo "✅ Backup completed at: $BACKUP_DIR"
```

### Step 3: Stop Current Services
```bash
# Stop PM2 application
pm2 stop fellowship-app
pm2 delete fellowship-app

# Stop nginx temporarily
sudo systemctl stop nginx
```

### Step 4: Upload New Application (From Local Machine)

**In a new terminal on your local machine:**
```bash
# Create temporary directory
mkdir -p ~/fellowship-deploy
cd ~/fellowship-deploy

# Copy all files from your working fellowship-app
cp -r /home/gloire/fellowship-app/* .

# Upload to server
scp -P 5645 -r * gloire@197.243.28.38:~/fellowship-new/
```

### Step 5: Deploy New Application (Back on Server)
```bash
# Move to the new application directory
cd ~/fellowship-new

# Install dependencies
npm install --production

# Create .env file with correct configuration
cat > .env << 'EOL'
# Database connection string for PostgreSQL
DATABASE_URL="postgresql://fellowship_user:Moh@2024!@localhost:5432/fellowship_db?schema=public"
DATABASE_URL_AUTHENTICATED="postgresql://fellowship_user:Moh@2024!@localhost:5432/fellowship_db?schema=public"

# App settings
NEXT_PUBLIC_APP_NAME="Affiliates Fellowship Program"
NEXT_PUBLIC_APP_URL="http://197.243.28.38:4000"

# Admin credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="adminpass123"

# User login credentials
USER_EMAIL="techdev925@gmail.com"
USER_PASSWORD="Admin@2027$"

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

# Update Prisma schema to use PostgreSQL
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
sed -i 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Copy files to application directory
sudo rm -rf /var/www/fellowship-app/*
sudo cp -r * /var/www/fellowship-app/
sudo chown -R www-data:www-data /var/www/fellowship-app
sudo chmod -R 755 /var/www/fellowship-app

# Clean up temporary files
rm -rf ~/fellowship-new
```

### Step 6: Configure Services for Port 4000
```bash
cd /var/www/fellowship-app

# Create PM2 ecosystem file for port 4000
cat > ecosystem.config.js << 'EOL'
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
sudo tee /etc/nginx/sites-available/fellowship-app << 'EOL'
server {
    listen 80;
    server_name 197.243.28.38;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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
```

### Step 7: Verify Deployment
```bash
# Check if application is running
pm2 logs fellowship-app --lines 10

# Test endpoints
curl -I http://localhost:4000/
curl -I http://localhost:4000/apply
curl -I http://localhost:4000/login
```

## 🧪 Testing the New Deployment

### Test Application Submission
1. Go to: `http://197.243.28.38:4000/apply`
2. Fill out the application form
3. Submit and verify it works

### Test Admin Dashboard
1. Go to: `http://197.243.28.38:4000/login`
2. Login with: `techdev925@gmail.com` / `admin123`
3. Check OTP email (should use port 4000 URLs)
4. Access admin dashboard
5. Verify all applications are visible
6. Test viewing application details
7. Test delete functionality (super admin)

### Test Email Functionality
1. Send funding requests to applicants
2. Verify all email links use `http://197.243.28.38:4000`
3. Test document submission links

## 🔧 Troubleshooting

### If Application Doesn't Start:
```bash
# Check PM2 logs
pm2 logs fellowship-app

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart fellowship-app
sudo systemctl restart nginx
```

### If Database Issues:
```bash
# Check database connection
npx prisma db push

# Check database status
sudo systemctl status postgresql
```

### If Port Issues:
```bash
# Check what's running on port 4000
sudo netstat -tlnp | grep :4000

# Kill any conflicting processes
sudo fuser -k 4000/tcp
```

## 📋 Final URLs

After successful deployment:
- **Main Page**: `http://197.243.28.38:4000/`
- **Application Form**: `http://197.243.28.38:4000/apply`
- **Login Page**: `http://197.243.28.38:4000/login`
- **Admin Dashboard**: `http://197.243.28.38:4000/admin`

## 🎯 Expected Results

✅ Application form submission working
✅ Admin can view all application details
✅ Super admin can delete applications
✅ All email links use port 4000
✅ Database data preserved and accessible
✅ All functionality matches your local fellowship-app

This manual approach ensures you have full control over each step and can verify everything is working correctly!



