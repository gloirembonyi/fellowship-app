#!/bin/bash

# Fix nginx configuration for port 4000
# This script fixes the nginx configuration to properly proxy to port 4000

echo "=== Fixing nginx configuration for port 4000 ==="

# Step 1: Stop nginx
echo "Step 1: Stopping nginx..."
sudo systemctl stop nginx

# Step 2: Create correct nginx configuration
echo "Step 2: Creating correct nginx configuration..."
sudo tee /etc/nginx/sites-available/fellowship-app << 'EOF'
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # For large file uploads
    client_max_body_size 50M;
}
EOF

# Step 3: Test nginx configuration
echo "Step 3: Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
    
    # Step 4: Start nginx
    echo "Step 4: Starting nginx..."
    sudo systemctl start nginx
    
    # Step 5: Check if application is running
    echo "Step 5: Checking application status..."
    pm2 status
    
    # Step 6: Start application if not running
    if ! pm2 list | grep -q "online"; then
        echo "Step 6: Starting application..."
        pm2 start ecosystem.config.js
        sleep 5
    fi
    
    # Step 7: Test the application
    echo "Step 7: Testing the application..."
    echo "Testing direct access to port 4000..."
    curl -I http://localhost:4000/apply
    
    echo "Testing via nginx on port 80..."
    curl -I http://197.243.28.38/apply
    
    echo "=== Fix Complete! ==="
    echo "Application should now be accessible at:"
    echo "- Direct: http://197.243.28.38:4000/apply"
    echo "- Via nginx: http://197.243.28.38/apply"
else
    echo "Nginx configuration test failed"
    exit 1
fi
