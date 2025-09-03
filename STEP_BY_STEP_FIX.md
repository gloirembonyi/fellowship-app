# Step-by-Step Fix for 502 Bad Gateway

## 🚨 **Current Status (Identified Issues)**

1. ✅ **Nginx**: Running but listening on port 4000 (WRONG)
2. ❌ **Application**: Errored status (can't start because port 4000 is occupied)
3. ❌ **Port 4000**: Occupied by nginx (should be used by your app)

## 🔧 **Step-by-Step Fix**

### **Step 1: Stop nginx to free port 4000**
```bash
sudo systemctl stop nginx
```

### **Step 2: Start your application**
```bash
pm2 start ecosystem.config.js
```

### **Step 3: Verify application is running**
```bash
pm2 status
```
**Expected**: Should show "online" status

### **Step 4: Test application directly**
```bash
curl -I http://localhost:4000/apply
```
**Expected**: Should show "HTTP/1.1 200 OK"

### **Step 5: Create correct nginx configuration**
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

### **Step 6: Test nginx configuration**
```bash
sudo nginx -t
```
**Expected**: Should show "nginx: configuration file /etc/nginx/nginx.conf test is successful"

### **Step 7: Start nginx**
```bash
sudo systemctl start nginx
```

### **Step 8: Test via nginx**
```bash
curl -I http://197.243.28.38/apply
```
**Expected**: Should show "HTTP/1.1 200 OK"

## ✅ **Final Result**

After completing all steps:
- ✅ Application runs on port 4000
- ✅ Nginx listens on port 80 and proxies to port 4000
- ✅ Application accessible at `http://197.243.28.38/apply`
- ✅ No more 502 Bad Gateway errors

## 🔍 **If any step fails**

Run these diagnostic commands:
```bash
# Check what's using port 4000
netstat -tlnp | grep :4000

# Check application logs
pm2 logs fellowship-app --lines 5

# Check nginx error logs
sudo tail -10 /var/log/nginx/error.log
```