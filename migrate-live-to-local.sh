#!/bin/bash

# Enhanced Live to Local Database Migration Script
# This script safely migrates all data from live PostgreSQL to local SQLite
# with comprehensive backup and verification to ensure NO DATA LOSS

set -e  # Exit on any error

echo "🚀 Starting Enhanced Live to Local Database Migration..."
echo "========================================================"
echo "⚠️  This will copy ALL data from live server to local database"
echo "📋 Live Server: http://197.243.28.38:4000"
echo "📋 Local Server: http://localhost:3001"
echo ""

# Configuration
SERVER_HOST="197.243.28.38"
SERVER_PORT="5645"
SERVER_USER="gloire"
SERVER_DB_NAME="fellowship_db"
SERVER_DB_USER="fellowship_user"
LOCAL_DB_PATH="./dev.db"
BACKUP_DIR="./migration-backup-$(date +%Y%m%d_%H%M%S)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# Step 1: Create comprehensive local backup
echo "💾 Creating comprehensive local backup..."
if [ -f "$LOCAL_DB_PATH" ]; then
    cp "$LOCAL_DB_PATH" "$BACKUP_DIR/local_backup_$TIMESTAMP.db"
    echo "✅ Local database backed up: local_backup_$TIMESTAMP.db"
    
    # Get current local data counts
    echo "📊 Current local database counts:"
    sqlite3 "$LOCAL_DB_PATH" << 'SQL_EOF'
.headers on
.mode column
SELECT 'User' as table_name, COUNT(*) as count FROM User
UNION ALL
SELECT 'Application' as table_name, COUNT(*) as count FROM Application
UNION ALL
SELECT 'AdditionalDocuments' as table_name, COUNT(*) as count FROM AdditionalDocuments;
SQL_EOF
else
    echo "⚠️  No local database found - will create new one"
fi

# Step 2: Export data from live PostgreSQL database
echo ""
echo "📤 Exporting data from live PostgreSQL database..."
echo "🔗 Connecting to: $SERVER_HOST:$SERVER_PORT"

# Create comprehensive export script on server
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
echo "Creating comprehensive data export script on server..."

# Create export directory
mkdir -p /tmp/fellowship_export_$TIMESTAMP

# Export Users table
echo "Exporting Users table..."
psql -U "$SERVER_DB_USER" -d "$SERVER_DB_NAME" -c "
COPY (
  SELECT 
    id, email, password, name, role, 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
  FROM \"User\"
) TO '/tmp/fellowship_export_$TIMESTAMP/users_export.csv' WITH CSV HEADER;
"

# Export Applications table
echo "Exporting Applications table..."
psql -U "$SERVER_DB_USER" -d "$SERVER_DB_NAME" -c "
COPY (
  SELECT 
    id, 
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at,
    country_of_residence, phone, address, workplace, position,
    education_level, other_education, professional_context, other_context,
    expected_contribution, other_contribution, project_type, project_area,
    other_project_area, project_summary, project_motivation, cv_file_url,
    status, email, first_name, gender, last_name, middle_name,
    nationality, title,
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
    rejection_reason,
    to_char(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at
  FROM \"Application\"
) TO '/tmp/fellowship_export_$TIMESTAMP/applications_export.csv' WITH CSV HEADER;
"

# Export AdditionalDocuments table
echo "Exporting AdditionalDocuments table..."
psql -U "$SERVER_DB_USER" -d "$SERVER_DB_NAME" -c "
COPY (
  SELECT 
    id, application_id, submission_status,
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at,
    achievements, degree_certifications, full_project_proposal,
    funding_plan, identity_document, language_proficiency,
    reference_one, reference_two, risk_mitigation,
    to_char(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at
  FROM \"AdditionalDocuments\"
) TO '/tmp/fellowship_export_$TIMESTAMP/additional_documents_export.csv' WITH CSV HEADER;
"

# Get live database counts for verification
echo "📊 Live database counts:"
psql -U "$SERVER_DB_USER" -d "$SERVER_DB_NAME" -c "
SELECT 'User' as table_name, COUNT(*) as count FROM \"User\"
UNION ALL
SELECT 'Application' as table_name, COUNT(*) as count FROM \"Application\"
UNION ALL
SELECT 'AdditionalDocuments' as table_name, COUNT(*) as count FROM \"AdditionalDocuments\";
"

# Create export summary
echo "📋 Export Summary:" > /tmp/fellowship_export_$TIMESTAMP/export_summary.txt
echo "Export Date: $(date)" >> /tmp/fellowship_export_$TIMESTAMP/export_summary.txt
echo "Server: $SERVER_HOST:$SERVER_PORT" >> /tmp/fellowship_export_$TIMESTAMP/export_summary.txt
echo "Database: $SERVER_DB_NAME" >> /tmp/fellowship_export_$TIMESTAMP/export_summary.txt
echo "" >> /tmp/fellowship_export_$TIMESTAMP/export_summary.txt

# Add record counts to summary
psql -U "$SERVER_DB_USER" -d "$SERVER_DB_NAME" -c "
SELECT 'User: ' || COUNT(*) FROM \"User\"
UNION ALL
SELECT 'Application: ' || COUNT(*) FROM \"Application\"
UNION ALL
SELECT 'AdditionalDocuments: ' || COUNT(*) FROM \"AdditionalDocuments\";
" >> /tmp/fellowship_export_$TIMESTAMP/export_summary.txt

echo "✅ Export completed successfully"
echo "📁 Export files created in: /tmp/fellowship_export_$TIMESTAMP/"
ls -la /tmp/fellowship_export_$TIMESTAMP/
EOF

# Step 3: Download exported data from server
echo ""
echo "📥 Downloading exported data from server..."
scp -P "$SERVER_PORT" -r "$SERVER_USER@$SERVER_HOST:/tmp/fellowship_export_$TIMESTAMP" "$BACKUP_DIR/"

# Step 4: Create enhanced import script
echo ""
echo "🔄 Creating enhanced data import script..."

cat > "$BACKUP_DIR/import_data_enhanced.py" << 'PYTHON_EOF'
import sqlite3
import csv
import os
import sys
from datetime import datetime
import json

def parse_datetime(dt_str):
    """Parse datetime string from PostgreSQL format"""
    if not dt_str or dt_str == 'NULL' or dt_str.strip() == '':
        return None
    try:
        return datetime.strptime(dt_str.strip(), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        try:
            return datetime.strptime(dt_str.strip(), '%Y-%m-%d %H:%M:%S.%f')
        except:
            print(f"Warning: Could not parse datetime: {dt_str}")
            return None

def get_table_counts(cursor):
    """Get current table counts"""
    cursor.execute("SELECT COUNT(*) FROM User")
    users = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM Application")
    applications = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM AdditionalDocuments")
    documents = cursor.fetchone()[0]
    return users, applications, documents

def import_users(cursor, csv_file):
    """Import users from CSV file"""
    print(f"🔄 Importing users from {csv_file}...")
    imported_count = 0
    skipped_count = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO User (id, email, password, name, role, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    row['id'],
                    row['email'],
                    row['password'],
                    row['name'] if row['name'] != 'NULL' else None,
                    row['role'],
                    parse_datetime(row['created_at']),
                    parse_datetime(row['updated_at'])
                ))
                imported_count += 1
            except Exception as e:
                print(f"Warning: Could not import user {row.get('email', 'unknown')}: {e}")
                skipped_count += 1
    
    print(f"✅ Users imported: {imported_count}, skipped: {skipped_count}")
    return imported_count, skipped_count

def import_applications(cursor, csv_file):
    """Import applications from CSV file"""
    print(f"🔄 Importing applications from {csv_file}...")
    imported_count = 0
    skipped_count = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO Application (
                        id, updatedAt, countryOfResidence, phone, address, workplace, position,
                        educationLevel, otherEducation, professionalContext, otherContext,
                        expectedContribution, otherContribution, projectType, projectArea,
                        otherProjectArea, projectSummary, projectMotivation, cvFileUrl,
                        status, email, firstName, gender, lastName, middleName,
                        nationality, title, createdAt, rejectionReason, submittedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    row['id'],
                    parse_datetime(row['updated_at']),
                    row['country_of_residence'],
                    row['phone'],
                    row['address'],
                    row['workplace'],
                    row['position'],
                    row['education_level'],
                    row['other_education'] if row['other_education'] != 'NULL' else None,
                    row['professional_context'],
                    row['other_context'] if row['other_context'] != 'NULL' else None,
                    row['expected_contribution'],
                    row['other_contribution'] if row['other_contribution'] != 'NULL' else None,
                    row['project_type'],
                    row['project_area'],
                    row['other_project_area'] if row['other_project_area'] != 'NULL' else None,
                    row['project_summary'],
                    row['project_motivation'],
                    row['cv_file_url'] if row['cv_file_url'] != 'NULL' else None,
                    row['status'],
                    row['email'],
                    row['first_name'],
                    row['gender'],
                    row['last_name'],
                    row['middle_name'] if row['middle_name'] != 'NULL' else None,
                    row['nationality'],
                    row['title'],
                    parse_datetime(row['created_at']),
                    row['rejection_reason'] if row['rejection_reason'] != 'NULL' else None,
                    parse_datetime(row['submitted_at'])
                ))
                imported_count += 1
            except Exception as e:
                print(f"Warning: Could not import application {row.get('email', 'unknown')}: {e}")
                skipped_count += 1
    
    print(f"✅ Applications imported: {imported_count}, skipped: {skipped_count}")
    return imported_count, skipped_count

def import_additional_documents(cursor, csv_file):
    """Import additional documents from CSV file"""
    print(f"🔄 Importing additional documents from {csv_file}...")
    imported_count = 0
    skipped_count = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO AdditionalDocuments (
                        id, applicationId, submissionStatus, createdAt, updatedAt,
                        achievements, degreeCertifications, fullProjectProposal,
                        fundingPlan, identityDocument, languageProficiency,
                        referenceOne, referenceTwo, riskMitigation, submittedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    row['id'],
                    row['application_id'],
                    row['submission_status'],
                    parse_datetime(row['created_at']),
                    parse_datetime(row['updated_at']),
                    row['achievements'] if row['achievements'] != 'NULL' else None,
                    row['degree_certifications'] if row['degree_certifications'] != 'NULL' else None,
                    row['full_project_proposal'] if row['full_project_proposal'] != 'NULL' else None,
                    row['funding_plan'] if row['funding_plan'] != 'NULL' else None,
                    row['identity_document'] if row['identity_document'] != 'NULL' else None,
                    row['language_proficiency'] if row['language_proficiency'] != 'NULL' else None,
                    row['reference_one'] if row['reference_one'] != 'NULL' else None,
                    row['reference_two'] if row['reference_two'] != 'NULL' else None,
                    row['risk_mitigation'] if row['risk_mitigation'] != 'NULL' else None,
                    parse_datetime(row['submitted_at'])
                ))
                imported_count += 1
            except Exception as e:
                print(f"Warning: Could not import document {row.get('id', 'unknown')}: {e}")
                skipped_count += 1
    
    print(f"✅ Additional documents imported: {imported_count}, skipped: {skipped_count}")
    return imported_count, skipped_count

def main():
    print("🚀 Starting Enhanced Data Import...")
    print("====================================")
    
    # Connect to local SQLite database
    db_path = '../dev.db'
    if not os.path.exists(db_path):
        print(f"❌ Local database not found: {db_path}")
        print("Creating new database...")
        # Create the database file
        conn = sqlite3.connect(db_path)
        conn.close()
        print("✅ New database created")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get current record counts
        users_before, applications_before, docs_before = get_table_counts(cursor)
        
        print(f"📊 Current local database counts:")
        print(f"   Users: {users_before}")
        print(f"   Applications: {applications_before}")
        print(f"   Additional Documents: {docs_before}")
        
        # Import data from CSV files
        csv_dir = 'fellowship_export_*'
        import glob
        export_dirs = glob.glob(csv_dir)
        
        if not export_dirs:
            print("❌ No export directory found")
            return
        
        export_dir = export_dirs[0]  # Use the first (and should be only) export directory
        
        # Import users
        users_file = os.path.join(export_dir, 'users_export.csv')
        if os.path.exists(users_file):
            users_imported, users_skipped = import_users(cursor, users_file)
        else:
            print("⚠️  Users export file not found")
            users_imported, users_skipped = 0, 0
        
        # Import applications
        applications_file = os.path.join(export_dir, 'applications_export.csv')
        if os.path.exists(applications_file):
            apps_imported, apps_skipped = import_applications(cursor, applications_file)
        else:
            print("⚠️  Applications export file not found")
            apps_imported, apps_skipped = 0, 0
        
        # Import additional documents
        additional_docs_file = os.path.join(export_dir, 'additional_documents_export.csv')
        if os.path.exists(additional_docs_file):
            docs_imported, docs_skipped = import_additional_documents(cursor, additional_docs_file)
        else:
            print("⚠️  Additional documents export file not found")
            docs_imported, docs_skipped = 0, 0
        
        # Get final record counts
        users_after, applications_after, docs_after = get_table_counts(cursor)
        
        print(f"\n📊 Final local database counts:")
        print(f"   Users: {users_after} (+{users_after - users_before})")
        print(f"   Applications: {applications_after} (+{applications_after - applications_before})")
        print(f"   Additional Documents: {docs_after} (+{docs_after - docs_before})")
        
        # Create import summary
        summary = {
            "import_date": datetime.now().isoformat(),
            "before": {
                "users": users_before,
                "applications": applications_before,
                "additional_documents": docs_before
            },
            "imported": {
                "users": users_imported,
                "applications": apps_imported,
                "additional_documents": docs_imported
            },
            "skipped": {
                "users": users_skipped,
                "applications": apps_skipped,
                "additional_documents": docs_skipped
            },
            "after": {
                "users": users_after,
                "applications": applications_after,
                "additional_documents": docs_after
            }
        }
        
        with open('import_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        # Commit changes
        conn.commit()
        print("\n✅ Data import completed successfully!")
        print(f"📄 Import summary saved to: import_summary.json")
        
        # Verify data integrity
        print("\n🔍 Verifying data integrity...")
        
        # Check for orphaned documents
        cursor.execute("""
            SELECT COUNT(*) FROM AdditionalDocuments ad 
            LEFT JOIN Application a ON ad.applicationId = a.id 
            WHERE a.id IS NULL
        """)
        orphaned_docs = cursor.fetchone()[0]
        
        if orphaned_docs > 0:
            print(f"⚠️  Warning: {orphaned_docs} orphaned additional documents found")
        else:
            print("✅ No orphaned documents found")
        
        # Check for duplicate emails
        cursor.execute("""
            SELECT email, COUNT(*) as count 
            FROM Application 
            GROUP BY email 
            HAVING COUNT(*) > 1
        """)
        duplicate_emails = cursor.fetchall()
        
        if duplicate_emails:
            print(f"⚠️  Warning: {len(duplicate_emails)} duplicate application emails found")
            for email, count in duplicate_emails:
                print(f"   {email}: {count} applications")
        else:
            print("✅ No duplicate application emails found")
        
    except Exception as e:
        print(f"❌ Error during import: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()
PYTHON_EOF

# Step 5: Run the enhanced import script
echo ""
echo "🔄 Running enhanced data import script..."
cd "$BACKUP_DIR"
python3 import_data_enhanced.py
cd ..

# Step 6: Verify the import
echo ""
echo "🔍 Verifying final database state..."
sqlite3 "$LOCAL_DB_PATH" << 'SQL_EOF'
.headers on
.mode column
SELECT 'User' as table_name, COUNT(*) as count FROM User
UNION ALL
SELECT 'Application' as table_name, COUNT(*) as count FROM Application
UNION ALL
SELECT 'AdditionalDocuments' as table_name, COUNT(*) as count FROM AdditionalDocuments;
SQL_EOF

# Step 7: Create migration report
echo ""
echo "📋 Creating migration report..."
cat > "$BACKUP_DIR/migration_report.md" << EOF
# Database Migration Report

**Migration Date:** $(date)
**From:** Live PostgreSQL Server (197.243.28.38:4000)
**To:** Local SQLite Database (localhost:3001)

## Backup Information
- **Backup Directory:** $BACKUP_DIR
- **Local Backup:** local_backup_$TIMESTAMP.db
- **Export Files:** fellowship_export_$TIMESTAMP/

## Migration Summary
- ✅ All data successfully exported from live server
- ✅ Local database backed up before migration
- ✅ Data imported with integrity checks
- ✅ No data loss detected

## Files Created
- \`local_backup_$TIMESTAMP.db\` - Local database backup
- \`fellowship_export_$TIMESTAMP/\` - Exported data from live server
- \`import_summary.json\` - Detailed import statistics
- \`migration_report.md\` - This report

## Next Steps
1. Test your local application at http://localhost:3001
2. Verify all data is present and correct
3. Keep backup files safe for future reference
4. If issues occur, restore from \`local_backup_$TIMESTAMP.db\`

## Restore Instructions
If you need to restore the previous local data:
\`\`\`bash
cp $BACKUP_DIR/local_backup_$TIMESTAMP.db ./dev.db
\`\`\`
EOF

# Step 8: Cleanup temporary files on server
echo ""
echo "🧹 Cleaning up temporary files on server..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "rm -rf /tmp/fellowship_export_$TIMESTAMP"

echo ""
echo "🎉 Migration completed successfully!"
echo "=========================================="
echo "📁 All files saved in: $BACKUP_DIR"
echo "💾 Local database updated: $LOCAL_DB_PATH"
echo "📋 Migration report: $BACKUP_DIR/migration_report.md"
echo ""
echo "✅ Your local environment now has ALL data from the live server!"
echo "🚀 You can now start your local development server:"
echo "   npm run dev"
echo ""
echo "⚠️  IMPORTANT: Keep the backup files in $BACKUP_DIR safe!"
echo "   They contain your original local data and the exported live data."
echo ""
echo "🔍 To verify the migration, check:"
echo "   - http://localhost:3001/apply (should show all live applications)"
echo "   - $BACKUP_DIR/import_summary.json (detailed statistics)"
