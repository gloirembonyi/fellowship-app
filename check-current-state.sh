#!/bin/bash

# Quick State Check Script
# This script checks the current state of both local and live databases

set -e

# Configuration
LIVE_SERVER="197.243.28.38"
LIVE_PORT="5645"
LIVE_USER="gloire"
LIVE_APP_DIR="/home/gloire/fellowship-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔍 Checking Current State of Fellowship Application"
echo "================================================="

# Check local database
print_status "Checking LOCAL database state..."
if [ -f "dev.db" ]; then
    echo "📊 Local Database Statistics:"
    sqlite3 dev.db "
        SELECT 'Users: ' || COUNT(*) FROM User;
        SELECT 'Applications: ' || COUNT(*) FROM Application;
        SELECT 'AdditionalDocuments: ' || COUNT(*) FROM AdditionalDocuments;
    "
    echo "📁 Local database size: $(ls -lh dev.db | awk '{print $5}')"
    echo "📅 Local database modified: $(ls -l dev.db | awk '{print $6, $7, $8}')"
    
    # Show recent applications
    echo ""
    echo "📋 Recent Local Applications:"
    sqlite3 dev.db "SELECT email, firstName, lastName, status, createdAt FROM Application ORDER BY createdAt DESC LIMIT 3;" | while IFS='|' read -r email first last status created; do
        echo "   $email - $first $last ($status) - $created"
    done
else
    print_warning "Local database (dev.db) not found"
fi

echo ""
echo "================================================="

# Check live database
print_status "Checking LIVE database state..."
ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
    cd '$LIVE_APP_DIR'
    if [ -f 'dev.db' ]; then
        echo '📊 Live Database Statistics:'
        sqlite3 dev.db '
            SELECT \"Users: \" || COUNT(*) FROM User;
            SELECT \"Applications: \" || COUNT(*) FROM Application;
            SELECT \"AdditionalDocuments: \" || COUNT(*) FROM AdditionalDocuments;
        '
        echo \"📁 Live database size: \$(ls -lh dev.db | awk '{print \$5}')\"
        echo \"📅 Live database modified: \$(ls -l dev.db | awk '{print \$6, \$7, \$8}')\"
        
        echo ''
        echo '📋 Recent Live Applications:'
        sqlite3 dev.db 'SELECT email, firstName, lastName, status, createdAt FROM Application ORDER BY createdAt DESC LIMIT 3;' | while IFS='|' read -r email first last status created; do
            echo \"   \$email - \$first \$last (\$status) - \$created\"
        done
        
        echo ''
        echo '🔄 Application Status:'
        pm2 status || echo 'PM2 not running'
        
        echo ''
        echo '🌐 Server Status:'
        curl -s -o /dev/null -w 'HTTP Status: %{http_code}' http://localhost:4000/apply || echo 'Application not responding'
        echo ''
    else
        echo 'Live database (dev.db) not found'
    fi
"

echo ""
echo "================================================="

# Check for existing backups
print_status "Checking existing backups..."
echo "📁 Local backups:"
ls -la *backup*.db 2>/dev/null || echo "   No local backups found"

echo ""
echo "📁 Live server backups:"
ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
    cd '$LIVE_APP_DIR'
    ls -la *backup*.db 2>/dev/null || echo '   No live backups found'
"

echo ""
echo "================================================="
print_success "State check completed!"
print_warning "Review the information above before proceeding with backup and deployment."
