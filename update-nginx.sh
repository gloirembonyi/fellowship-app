echo 'Updating nginx configuration...'
sudo tee /etc/nginx/sites-available/fellowship-app << 'NGINX_EOF'
server {
    listen 80;
    server_name 197.243.28.38;

    location / {
        proxy_pass http://localhost:3001;
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
NGINX_EOF

echo 'Testing nginx configuration...'
sudo nginx -t

echo 'Reloading nginx...'
sudo systemctl reload nginx

echo 'Nginx configuration updated successfully!'
