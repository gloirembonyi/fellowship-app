# Manual Commands to Fix the 502 Bad Gateway Error

## 🚨 **You are already connected to the server!**

Since you're already connected to the server, run these commands one by one:

### **Step 1: Stop nginx**
```bash
sudo systemctl stop nginx
```

### **Step 2: Create correct nginx configuration**
```bash
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
```

### **Step 3: Test nginx configuration**
```bash
sudo nginx -t
```

### **Step 4: Start nginx**
```bash
sudo systemctl start nginx
```

### **Step 5: Check application status**
```bash
pm2 status
```

### **Step 6: Test the application**
```bash
curl -I http://localhost:4000/apply
```

### **Step 7: Test via nginx**
```bash
curl -I http://197.243.28.38/apply
```

## ✅ **Expected Results**

After running these commands:
- Step 3 should show: "nginx: configuration file /etc/nginx/nginx.conf test is successful"
- Step 5 should show: "online" status for fellowship-app
- Step 6 should show: "HTTP/1.1 200 OK"
- Step 7 should show: "HTTP/1.1 200 OK"

## 🔍 **If you still get errors**

If any step fails, run these diagnostic commands:

```bash
# Check what's using port 4000
netstat -tlnp | grep :4000

# Check nginx error logs
sudo tail -20 /var/log/nginx/error.log

# Check application logs
pm2 logs fellowship-app --lines 10
```
