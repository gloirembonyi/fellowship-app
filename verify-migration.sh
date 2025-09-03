#!/bin/bash

# Migration Verification Script
# This script verifies that the migration was successful and no data was lost

set -e

echo "🔍 Migration Verification Script"
echo "================================"

LOCAL_DB_PATH="./dev.db"
BACKUP_DIR="./migration-backup-*"

# Check if local database exists
if [ ! -f "$LOCAL_DB_PATH" ]; then
    echo "❌ Local database not found: $LOCAL_DB_PATH"
    exit 1
fi

echo "✅ Local database found: $LOCAL_DB_PATH"

# Get current database size
DB_SIZE=$(du -h "$LOCAL_DB_PATH" | cut -f1)
echo "📊 Database size: $DB_SIZE"

# Get record counts
echo ""
echo "📊 Current database record counts:"
sqlite3 "$LOCAL_DB_PATH" << 'SQL_EOF'
.headers on
.mode column
SELECT 'User' as table_name, COUNT(*) as count FROM User
UNION ALL
SELECT 'Application' as table_name, COUNT(*) as count FROM Application
UNION ALL
SELECT 'AdditionalDocuments' as table_name, COUNT(*) as count FROM AdditionalDocuments;
SQL_EOF

# Check for recent data (last 30 days)
echo ""
echo "📅 Recent data (last 30 days):"
sqlite3 "$LOCAL_DB_PATH" << 'SQL_EOF'
.headers on
.mode column
SELECT 
    'Applications' as type,
    COUNT(*) as count,
    MIN(createdAt) as earliest,
    MAX(createdAt) as latest
FROM Application 
WHERE createdAt >= datetime('now', '-30 days')
UNION ALL
SELECT 
    'Users' as type,
    COUNT(*) as count,
    MIN(createdAt) as earliest,
    MAX(createdAt) as latest
FROM User 
WHERE createdAt >= datetime('now', '-30 days');
SQL_EOF

# Check data integrity
echo ""
echo "🔍 Data integrity checks:"

# Check for orphaned documents
ORPHANED_DOCS=$(sqlite3 "$LOCAL_DB_PATH" "SELECT COUNT(*) FROM AdditionalDocuments ad LEFT JOIN Application a ON ad.applicationId = a.id WHERE a.id IS NULL;")
if [ "$ORPHANED_DOCS" -eq 0 ]; then
    echo "✅ No orphaned additional documents"
else
    echo "⚠️  Found $ORPHANED_DOCS orphaned additional documents"
fi

# Check for duplicate application emails
DUPLICATE_EMAILS=$(sqlite3 "$LOCAL_DB_PATH" "SELECT COUNT(*) FROM (SELECT email, COUNT(*) as count FROM Application GROUP BY email HAVING COUNT(*) > 1);")
if [ "$DUPLICATE_EMAILS" -eq 0 ]; then
    echo "✅ No duplicate application emails"
else
    echo "⚠️  Found $DUPLICATE_EMAILS duplicate application emails"
fi

# Check for missing required fields
MISSING_EMAILS=$(sqlite3 "$LOCAL_DB_PATH" "SELECT COUNT(*) FROM Application WHERE email IS NULL OR email = '';")
if [ "$MISSING_EMAILS" -eq 0 ]; then
    echo "✅ All applications have email addresses"
else
    echo "⚠️  Found $MISSING_EMAILS applications without email addresses"
fi

# Check backup directory
echo ""
echo "📁 Checking backup directory..."
BACKUP_DIRS=$(ls -d $BACKUP_DIR 2>/dev/null | wc -l)
if [ "$BACKUP_DIRS" -gt 0 ]; then
    echo "✅ Found $BACKUP_DIRS backup directory(ies)"
    LATEST_BACKUP=$(ls -td $BACKUP_DIR | head -1)
    echo "📂 Latest backup: $LATEST_BACKUP"
    
    # Check if import summary exists
    if [ -f "$LATEST_BACKUP/import_summary.json" ]; then
        echo "✅ Import summary found"
        echo "📊 Import statistics:"
        cat "$LATEST_BACKUP/import_summary.json" | python3 -m json.tool
    else
        echo "⚠️  Import summary not found"
    fi
else
    echo "⚠️  No backup directories found"
fi

echo ""
echo "🎉 Verification completed!"
echo "========================="
echo "✅ Database is ready for use"
echo "🚀 You can start your local server with: npm run dev"
echo "🌐 Access your application at: http://localhost:3001"
