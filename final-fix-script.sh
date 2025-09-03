#!/bin/bash

# Final Fix Script for Fellowship App
# This script will properly configure nginx and the application

echo "=== Fellowship App Final Fix ==="

# Step 1: Stop all processes
echo "Step 1: Stopping all processes..."
pm2 stop all
pm2 delete all

# Step 2: Kill any process on port 4000
echo "Step 2: Freeing port 4000..."
fuser -k 4000/tcp 2>/dev/null || echo "Port 4000 is free"

# Step 3: Create correct nginx configuration
echo "Step 3: Creating correct nginx configuration..."
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

# Step 4: Test nginx configuration
echo "Step 4: Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
    
    # Step 5: Start nginx
    echo "Step 5: Starting nginx..."
    sudo systemctl start nginx
    sudo systemctl reload nginx
    
    # Step 6: Start the application
    echo "Step 6: Starting the application..."
    pm2 start ecosystem.config.js
    
    # Step 7: Wait for application to start
    echo "Step 7: Waiting for application to start..."
    sleep 10
    
    # Step 8: Check status
    echo "Step 8: Checking application status..."
    pm2 status
    
    # Step 9: Test the application
    echo "Step 9: Testing the application..."
    curl -I http://localhost:4000/apply
    curl -I http://197.243.28.38/apply
    
    echo "=== Fix Complete! ==="
    echo "Application should now be accessible at:"
    echo "- Direct: http://197.243.28.38:4000/apply"
    echo "- Via nginx: http://197.243.28.38/apply"
else
    echo "Nginx configuration test failed"
    exit 1
fi

