#!/bin/bash

echo "🔧 Applying simple fixes to live server..."

# Copy updated files
echo "📤 Copying updated files..."
scp -P 5645 lib/emailService.ts gloire@197.243.28.38:/var/www/fellowship-app/lib/
scp -P 5645 app/admin/applications/page.tsx gloire@197.243.28.38:/var/www/fellowship-app/app/admin/applications/
scp -P 5645 app/api/admin/applications/[id]/route.ts gloire@197.243.28.38:~/admin-route.ts

echo "✅ Files copied"

echo "🔧 Applying fixes on server..."
ssh -p 5645 gloire@197.243.28.38 "
    cd /var/www/fellowship-app
    
    # Move admin route file
    sudo cp ~/admin-route.ts app/api/admin/applications/[id]/route.ts
    sudo chown www-data:www-data app/api/admin/applications/[id]/route.ts
    
    # Update environment variables
    sed -i 's|NEXT_PUBLIC_APP_URL=\"http://197.243.28.38\"|NEXT_PUBLIC_APP_URL=\"http://197.243.28.38\"|' .env
    
    # Fix nginx configuration
    sudo sed -i 's/proxy_pass http:\/\/localhost:4000;/proxy_pass http:\/\/localhost:3000;/' /etc/nginx/sites-available/fellowship-app
    sudo nginx -t && sudo systemctl restart nginx
    
    # Restart application
    pm2 restart fellowship-app
    
    echo '✅ Fixes applied successfully'
    pm2 status
"

echo "🎉 Simple fixes completed!"



