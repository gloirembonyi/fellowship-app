# Fellowship Application Form Deployment Guide

This guide provides detailed instructions for deploying the Fellowship Application Form on a Linux server with PostgreSQL.

## Prerequisites

- A Linux server (Ubuntu/Debian recommended)
- Root or sudo access
- Domain name pointing to your server (optional but recommended)

## Deployment Options

### Option 1: Automated Deployment (Recommended)

We've provided a deployment script that automates the entire process:

1. Connect to your server via SSH:

   ```bash
   ssh user@your-server-ip
   ```

2. Clone the repository:

   ```bash
   git clone https://github.com/Global-Kwik-Koders/Affiliate-fellowship-program-application.git
   cd Affiliate-fellowship-program-application
   ```

3. Update the deployment script with your specific settings:

   ```bash
   nano deploy.sh
   ```

   - Update `DB_PASSWORD` with a secure password
   - Change `your-domain.com` to your actual domain

4. Make the script executable and run it:

   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

5. The script will:
   - Install all required dependencies
   - Set up PostgreSQL database
   - Configure Nginx
   - Set up PM2 for process management
   - Configure automatic backups
   - Set up the firewall

### Option 2: Manual Deployment

If you prefer to deploy manually, follow these steps:

#### 1. Install Required Software

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### 2. Configure PostgreSQL

```bash
# Access PostgreSQL
sudo -i -u postgres
psql

# Create database and user
CREATE DATABASE fellowship_db;
CREATE USER fellowship_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE fellowship_db TO fellowship_user;

# Exit PostgreSQL
\q
exit
```

#### 3. Deploy Application

```bash
# Create application directory
sudo mkdir -p /var/www/fellowship-app
sudo chown $USER:$USER /var/www/fellowship-app
cd /var/www/fellowship-app

# Clone repository
git clone https://github.com/Global-Kwik-Koders/Affiliate-fellowship-program-application.git .

# Install dependencies
npm install

# Create .env file
nano .env
```

Add the following content to your `.env` file:

```
DATABASE_URL="postgresql://fellowship_user:your_strong_password@localhost:5432/fellowship_db?schema=public"
NEXT_PUBLIC_APP_NAME="Affiliates Fellowship Program"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="secure_admin_password_here"
EMAIL_HOST="mail.moh.gov.rw"
EMAIL_PORT="587"
EMAIL_USER="noreply"
EMAIL_PASSWORD="Moh@2024!"
EMAIL_FROM="MoH Affiliate Fellowship Program <noreply@moh.gov.rw>"
EMAIL_SECURE="false"
EMAIL_CONTACT="fellowship@moh.gov.rw"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

Continue with:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Configure PM2
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: "fellowship-app",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    }
  ]
};
EOL

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/fellowship-app
```

Add the following content:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # For large file uploads
    client_max_body_size 50M;
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/fellowship-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Set Up SSL (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### 6. Configure Upload Directories

```bash
mkdir -p public/uploads/{identityDocument,degreeCertifications,languageProficiency,referenceOne,referenceTwo,fullProjectProposal,fundingPlan,riskMitigation,achievements}
chmod -R 755 public/uploads
```

#### 7. Set Up Database Backups

```bash
nano backup-db.sh
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/fellowship-app"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="fellowship_db_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
sudo -u postgres pg_dump fellowship_db > $BACKUP_DIR/$FILENAME

# Compress backup
gzip $BACKUP_DIR/$FILENAME

# Keep only the last 7 backups
find $BACKUP_DIR -name "fellowship_db_backup_*.sql.gz" -type f -mtime +7 -delete
```

Make it executable and set up a cron job:

```bash
chmod +x backup-db.sh
crontab -e
```

Add this line to run the backup daily at 2 AM:

```
0 2 * * * /var/www/fellowship-app/backup-db.sh
```

#### 8. Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## Maintenance and Troubleshooting

### Updating the Application

To update the application with the latest changes:

```bash
cd /var/www/fellowship-app
git pull
npm install
npx prisma generate
npm run build
pm2 reload fellowship-app
```

### Checking Logs

```bash
# Application logs
pm2 logs fellowship-app

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Common Issues

1. **Database connection errors**

   - Check PostgreSQL service: `sudo systemctl status postgresql`
   - Verify database credentials in `.env`

2. **Email sending failures**

   - Test SMTP connection: `telnet mail.moh.gov.rw 587`
   - Check email credentials in `.env`

3. **Permission problems**

   - Ensure proper ownership: `sudo chown -R $USER:$USER /var/www/fellowship-app`
   - Check upload directory permissions: `chmod -R 755 public/uploads`

4. **Application not starting**

   - Check PM2 logs: `pm2 logs fellowship-app`
   - Verify Node.js version: `node -v` (should be 20.x or higher)

5. **Nginx errors**
   - Check configuration: `sudo nginx -t`
   - Restart Nginx: `sudo systemctl restart nginx`

## Backup and Recovery

### Manual Database Backup

```bash
sudo -u postgres pg_dump fellowship_db > backup.sql
```

### Restoring from Backup

```bash
sudo -u postgres psql fellowship_db < backup.sql
```

## Security Recommendations

1. **Update regularly**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure fail2ban**

   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

3. **Regular security audits**

   ```bash
   sudo apt install lynis
   sudo lynis audit system
   ```

4. **Monitor logs**
   ```bash
   sudo apt install logwatch
   sudo logwatch --output mail --mailto your-email@example.com --detail high
   ```

For additional support, please contact the development team.
