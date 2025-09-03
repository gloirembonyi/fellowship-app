#!/bin/bash

# Complete fix script for Fellowship App on port 4000
# Run this on the live server

echo "=== Fellowship App Complete Fix ==="

# Step 1: Stop all processes and free port 4000
echo "Step 1: Stopping all processes..."
pm2 stop all
pm2 delete all
fuser -k 4000/tcp 2>/dev/null || echo "Port 4000 is free"

# Step 2: Update nginx configuration
echo "Step 2: Updating nginx configuration..."
sudo sed -i 's/proxy_pass http:\/\/localhost:3000;/proxy_pass http:\/\/localhost:4000;/' /etc/nginx/sites-available/fellowship-app

# Step 3: Test nginx configuration
echo "Step 3: Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
    
    # Step 4: Reload nginx
    echo "Step 4: Reloading nginx..."
    sudo systemctl reload nginx
    
    # Step 5: Start the application
    echo "Step 5: Starting the application..."
    pm2 start ecosystem.config.js
    
    # Step 6: Wait for application to start
    echo "Step 6: Waiting for application to start..."
    sleep 10
    
    # Step 7: Check status
    echo "Step 7: Checking application status..."
    pm2 status
    
    # Step 8: Test the application
    echo "Step 8: Testing the application..."
    curl -I http://localhost:4000/apply
    
    echo "=== Fix Complete! ==="
    echo "Application should now be accessible at: http://197.243.28.38:4000/apply"
else
    echo "Nginx configuration test failed"
    exit 1
fi

