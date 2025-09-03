#!/bin/bash

# Script to update nginx configuration for port 4000
# Run this on the live server

echo "=== Updating Nginx Configuration for Port 4000 ==="

# Create nginx configuration
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

echo "Nginx configuration updated"

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
    
    # Reload nginx
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "=== Nginx Configuration Updated Successfully! ==="
    echo "Application should now be accessible at: http://197.243.28.38/apply"
else
    echo "Nginx configuration test failed"
    exit 1
fi

