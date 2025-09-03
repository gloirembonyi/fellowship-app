#!/bin/bash

# Comprehensive Backup and Deployment Script for Fellowship Program
# This script safely backs up the live database, merges with local changes, and deploys

set -e

echo "🚀 Starting Comprehensive Backup and Deployment Process"
echo "=================================================="

# Configuration
LIVE_SERVER="197.243.28.38"
LIVE_PORT="5645"
LIVE_USER="gloire"
LIVE_APP_DIR="/home/gloire/fellowship-app"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Step 1: Create comprehensive backup of live database
backup_live_database() {
    print_status "Step 1: Creating comprehensive backup of live database..."
    
    # Create backup on live server
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        
        # Create timestamped backup
        cp dev.db dev_backup_comprehensive_\$(date +%Y%m%d_%H%M%S).db
        
        # Also create a copy with a standard name for easy access
        cp dev.db live_db_backup.db
        
        echo 'Live database backup created'
        
        # Show backup info
        ls -lh dev_backup_comprehensive_*.db | tail -1
        ls -lh live_db_backup.db
    "
    
    # Download the backup to local machine
    print_status "Downloading live database backup..."
    scp -P "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER:$LIVE_APP_DIR/live_db_backup.db" "$BACKUP_DIR/"
    
    print_success "Live database backup completed and downloaded"
}

# Step 2: Check current state of both databases
check_database_states() {
    print_status "Step 2: Checking current state of both databases..."
    
    echo "=== LOCAL DATABASE STATE ==="
    if [ -f "dev.db" ]; then
        sqlite3 dev.db "
            SELECT 'Users: ' || COUNT(*) FROM User;
            SELECT 'Applications: ' || COUNT(*) FROM Application;
            SELECT 'AdditionalDocuments: ' || COUNT(*) FROM AdditionalDocuments;
        "
        echo "Local database size: $(ls -lh dev.db | awk '{print $5}')"
    else
        print_warning "Local database not found"
    fi
    
    echo ""
    echo "=== LIVE DATABASE STATE ==="
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        if [ -f 'dev.db' ]; then
            sqlite3 dev.db '
                SELECT \"Users: \" || COUNT(*) FROM User;
                SELECT \"Applications: \" || COUNT(*) FROM Application;
                SELECT \"AdditionalDocuments: \" || COUNT(*) FROM AdditionalDocuments;
            '
            echo \"Live database size: \$(ls -lh dev.db | awk '{print \$5}')\"
        else
            echo 'Live database not found'
        fi
    "
}

# Step 3: Merge databases (live data into local)
merge_databases() {
    print_status "Step 3: Merging live database data into local database..."
    
    if [ ! -f "$BACKUP_DIR/live_db_backup.db" ]; then
        print_error "Live database backup not found. Cannot proceed with merge."
        exit 1
    fi
    
    # Create backup of local database before merge
    cp dev.db "$BACKUP_DIR/local_db_backup_$TIMESTAMP.db"
    print_status "Local database backed up to $BACKUP_DIR/local_db_backup_$TIMESTAMP.db"
    
    # Run the Python merge script
    if [ -f "merge_databases_robust.py" ]; then
        # Update the script to use the downloaded backup
        sed "s/server_db_backup.db/$BACKUP_DIR\/live_db_backup.db/g" merge_databases_robust.py > merge_temp.py
        python3 merge_temp.py
        rm merge_temp.py
    else
        print_error "merge_databases_robust.py not found"
        exit 1
    fi
    
    print_success "Database merge completed"
}

# Step 4: Verify merged database
verify_merged_database() {
    print_status "Step 4: Verifying merged database..."
    
    echo "=== MERGED DATABASE STATE ==="
    sqlite3 dev.db "
        SELECT 'Users: ' || COUNT(*) FROM User;
        SELECT 'Applications: ' || COUNT(*) FROM Application;
        SELECT 'AdditionalDocuments: ' || COUNT(*) FROM AdditionalDocuments;
    "
    
    # Check for data integrity
    echo ""
    echo "=== DATA INTEGRITY CHECKS ==="
    
    # Check for orphaned documents
    ORPHANED=$(sqlite3 dev.db "
        SELECT COUNT(*) FROM AdditionalDocuments ad 
        LEFT JOIN Application a ON ad.applicationId = a.id 
        WHERE a.id IS NULL
    ")
    
    if [ "$ORPHANED" -gt 0 ]; then
        print_warning "Found $ORPHANED orphaned additional documents"
    else
        print_success "No orphaned documents found"
    fi
    
    # Check for duplicate emails
    DUPLICATES=$(sqlite3 dev.db "
        SELECT COUNT(*) FROM (
            SELECT email, COUNT(*) as count 
            FROM Application 
            GROUP BY email 
            HAVING COUNT(*) > 1
        )
    ")
    
    if [ "$DUPLICATES" -gt 0 ]; then
        print_warning "Found $DUPLICATES duplicate application emails"
    else
        print_success "No duplicate application emails found"
    fi
    
    print_success "Database verification completed"
}

# Step 5: Deploy updated code to live server
deploy_to_live() {
    print_status "Step 5: Deploying updated code to live server..."
    
    # Stop the application on live server
    print_status "Stopping application on live server..."
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        pm2 stop fellowship-app || echo 'Application not running'
    "
    
    # Create backup of live database before deployment
    print_status "Creating final backup before deployment..."
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        cp dev.db dev_backup_before_deploy_\$(date +%Y%m%d_%H%M%S).db
    "
    
    # Upload merged database to live server
    print_status "Uploading merged database to live server..."
    scp -P "$LIVE_PORT" dev.db "$LIVE_USER@$LIVE_SERVER:$LIVE_APP_DIR/"
    
    # Upload updated code
    print_status "Uploading updated code..."
    rsync -avz --delete -e "ssh -p $LIVE_PORT" \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '.git' \
        --exclude 'dev.db' \
        --exclude '*.log' \
        --exclude 'backups' \
        ./ "$LIVE_USER@$LIVE_SERVER:$LIVE_APP_DIR/"
    
    # Install dependencies and build on live server
    print_status "Installing dependencies and building on live server..."
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        
        # Install dependencies
        npm install
        
        # Generate Prisma client
        npx prisma generate
        
        # Build the application
        npm run build
        
        # Start the application
        pm2 start ecosystem.config.js
        
        echo 'Application deployed and started'
    "
    
    print_success "Code deployment completed"
}

# Step 6: Verify deployment
verify_deployment() {
    print_status "Step 6: Verifying deployment..."
    
    # Wait a moment for the application to start
    sleep 5
    
    # Check if application is running
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        pm2 status
    "
    
    # Test the application
    print_status "Testing application endpoints..."
    
    # Test main page
    if curl -s -o /dev/null -w "%{http_code}" "http://$LIVE_SERVER:4000/apply" | grep -q "200"; then
        print_success "Application main page is accessible"
    else
        print_warning "Application main page may not be accessible"
    fi
    
    # Test admin login page
    if curl -s -o /dev/null -w "%{http_code}" "http://$LIVE_SERVER:4000/login" | grep -q "200"; then
        print_success "Admin login page is accessible"
    else
        print_warning "Admin login page may not be accessible"
    fi
    
    print_success "Deployment verification completed"
}

# Step 7: Show final summary
show_summary() {
    print_status "Step 7: Deployment Summary"
    echo "=================================="
    
    echo "📁 Backups created:"
    ls -la "$BACKUP_DIR/"
    
    echo ""
    echo "🌐 Live server status:"
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        echo 'Application status:'
        pm2 status
        echo ''
        echo 'Database size:'
        ls -lh dev.db
        echo ''
        echo 'Recent backups:'
        ls -lh dev_backup_*.db | tail -3
    "
    
    echo ""
    echo "🔗 Application URLs:"
    echo "   Main Application: http://$LIVE_SERVER:4000/apply"
    echo "   Admin Login: http://$LIVE_SERVER:4000/login"
    
    print_success "=== DEPLOYMENT COMPLETED SUCCESSFULLY! ==="
    print_warning "Please test the application thoroughly to ensure everything is working correctly."
}

# Main execution
main() {
    print_status "Starting comprehensive backup and deployment process..."
    
    # Step 1: Backup live database
    backup_live_database
    
    # Step 2: Check database states
    check_database_states
    
    # Step 3: Merge databases
    merge_databases
    
    # Step 4: Verify merged database
    verify_merged_database
    
    # Step 5: Deploy to live
    deploy_to_live
    
    # Step 6: Verify deployment
    verify_deployment
    
    # Step 7: Show summary
    show_summary
}

# Run main function
main "$@"
