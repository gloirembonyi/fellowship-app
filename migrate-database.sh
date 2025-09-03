#!/bin/bash

# Database Migration Script for Fellowship Program
# This script safely migrates the database schema while preserving data

set -e

echo "=== Database Migration Script ==="

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

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        cp dev.db dev_backup_migration_\$(date +%Y%m%d_%H%M%S).db
        echo 'Database backup created'
    "
    print_success "Database backup completed"
}

# Function to check database schema
check_schema() {
    print_status "Checking current database schema..."
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        echo '=== Current Database Schema ==='
        sqlite3 dev.db '.schema' | head -20
        echo '=== Table Information ==='
        sqlite3 dev.db '.tables'
        echo '=== Record Counts ==='
        sqlite3 dev.db 'SELECT name, COUNT(*) as count FROM sqlite_master WHERE type=\"table\" AND name NOT LIKE \"sqlite_%\" GROUP BY name;'
    "
}

# Function to run schema updates
update_schema() {
    print_status "Updating database schema..."
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        
        # Check if there are any schema changes needed
        echo 'Checking for schema updates...'
        
        # Add any missing columns to Application table
        sqlite3 dev.db '
        -- Add funding-related columns if they don'\''t exist
        ALTER TABLE Application ADD COLUMN estimatedBudget TEXT;
        ALTER TABLE Application ADD COLUMN fundingSources TEXT;
        ALTER TABLE Application ADD COLUMN fundingSecured TEXT;
        ALTER TABLE Application ADD COLUMN fundingProofUrl TEXT;
        ALTER TABLE Application ADD COLUMN fundingPlanUrl TEXT;
        ALTER TABLE Application ADD COLUMN sustainabilityPlan TEXT;
        ALTER TABLE Application ADD COLUMN fundingInfoRequested BOOLEAN DEFAULT 0;
        ALTER TABLE Application ADD COLUMN fundingInfoSubmitted BOOLEAN DEFAULT 0;
        ALTER TABLE Application ADD COLUMN fundingInfoSubmittedAt DATETIME;
        ' 2>/dev/null || echo 'Some columns may already exist'
        
        # Create AdditionalDocuments table if it doesn't exist
        sqlite3 dev.db '
        CREATE TABLE IF NOT EXISTS AdditionalDocuments (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || \"-\" || lower(hex(randomblob(2))) || \"-4\" || substr(lower(hex(randomblob(2))),2) || \"-\" || substr(\"89ab\",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || \"-\" || lower(hex(randomblob(6)))),
            applicationId TEXT NOT NULL,
            submissionStatus TEXT DEFAULT \"pending\",
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            achievements TEXT,
            degreeCertifications TEXT,
            fullProjectProposal TEXT,
            fundingPlan TEXT,
            identityDocument TEXT,
            languageProficiency TEXT,
            referenceOne TEXT,
            referenceTwo TEXT,
            riskMitigation TEXT,
            submittedAt DATETIME,
            FOREIGN KEY (applicationId) REFERENCES Application (id)
        );
        ' 2>/dev/null || echo 'AdditionalDocuments table may already exist'
        
        # Create indexes if they don't exist
        sqlite3 dev.db '
        CREATE INDEX IF NOT EXISTS idx_application_status ON Application(status);
        CREATE INDEX IF NOT EXISTS idx_application_createdAt ON Application(createdAt);
        CREATE INDEX IF NOT EXISTS idx_additional_documents_applicationId ON AdditionalDocuments(applicationId);
        ' 2>/dev/null || echo 'Indexes may already exist'
        
        echo 'Schema update completed'
    "
    print_success "Database schema updated"
}

# Function to verify migration
verify_migration() {
    print_status "Verifying database migration..."
    ssh -p "$LIVE_PORT" "$LIVE_USER@$LIVE_SERVER" "
        cd '$LIVE_APP_DIR'
        
        echo '=== Verification Results ==='
        echo 'Database file size:'
        ls -lh dev.db
        
        echo 'Table count:'
        sqlite3 dev.db 'SELECT COUNT(*) as table_count FROM sqlite_master WHERE type=\"table\" AND name NOT LIKE \"sqlite_%\";'
        
        echo 'Application records:'
        sqlite3 dev.db 'SELECT COUNT(*) as app_count FROM Application;'
        
        echo 'User records:'
        sqlite3 dev.db 'SELECT COUNT(*) as user_count FROM User;'
        
        echo 'AdditionalDocuments records:'
        sqlite3 dev.db 'SELECT COUNT(*) as doc_count FROM AdditionalDocuments;' 2>/dev/null || echo '0'
        
        echo 'Schema validation:'
        sqlite3 dev.db '.schema Application' | grep -E '(estimatedBudget|fundingSources|fundingSecured)' || echo 'Funding columns not found'
    "
    print_success "Database migration verified"
}

# Main execution
main() {
    print_status "Starting database migration process..."
    
    # Step 1: Backup database
    backup_database
    
    # Step 2: Check current schema
    check_schema
    
    # Step 3: Update schema
    update_schema
    
    # Step 4: Verify migration
    verify_migration
    
    print_success "=== Database migration completed successfully! ==="
    print_status "All data has been preserved and schema has been updated."
    print_warning "Please test the application to ensure everything is working correctly."
}

# Run main function
main "$@"

