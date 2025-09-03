#!/bin/bash

# Fellowship Program - Server to Local Data Sync Script
# This script safely exports data from the server PostgreSQL database
# and imports it to the local SQLite database without data loss

set -e  # Exit on any error

echo "🚀 Starting server to local data sync..."
echo "=========================================="

# Configuration
SERVER_HOST="197.243.28.38"
SERVER_PORT="5645"
SERVER_USER="gloire"
SERVER_DB_NAME="fellowship_db"
SERVER_DB_USER="fellowship_user"
LOCAL_DB_PATH="./dev.db"
BACKUP_DIR="./server-data-backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# Step 1: Create local backup of current data
echo "💾 Creating local backup of current data..."
cp "$LOCAL_DB_PATH" "$BACKUP_DIR/local_backup_$TIMESTAMP.db"
echo "✅ Local backup created: local_backup_$TIMESTAMP.db"

# Step 2: Export data from server PostgreSQL database
echo "📤 Exporting data from server PostgreSQL database..."

# Create export script on server
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << 'EOF'
echo "Creating data export script on server..."
cat > /tmp/export_data.sql << 'SQL_EOF'
-- Export Users table
COPY (
  SELECT 
    id, email, password, name, role, 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
  FROM "User"
) TO '/tmp/users_export.csv' WITH CSV HEADER;

-- Export Applications table
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
  FROM "Application"
) TO '/tmp/applications_export.csv' WITH CSV HEADER;

-- Export AdditionalDocuments table
COPY (
  SELECT 
    id, application_id, submission_status,
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at,
    achievements, degree_certifications, full_project_proposal,
    funding_plan, identity_document, language_proficiency,
    reference_one, reference_two, risk_mitigation,
    to_char(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at
  FROM "AdditionalDocuments"
) TO '/tmp/additional_documents_export.csv' WITH CSV HEADER;

-- Get table counts
SELECT 'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Application' as table_name, COUNT(*) as count FROM "Application"
UNION ALL
SELECT 'AdditionalDocuments' as table_name, COUNT(*) as count FROM "AdditionalDocuments";
EOF

echo "Running data export on server..."
psql -U "$SERVER_DB_USER" -d "$SERVER_DB_NAME" -f /tmp/export_data.sql

echo "Data export completed on server"
echo "Files created:"
ls -la /tmp/*_export.csv
echo "Table counts:"
psql -U "$SERVER_DB_USER" -d "$SERVER_DB_NAME" -c "
SELECT 'User' as table_name, COUNT(*) as count FROM \"User\"
UNION ALL
SELECT 'Application' as table_name, COUNT(*) as count FROM \"Application\"
UNION ALL
SELECT 'AdditionalDocuments' as table_name, COUNT(*) as count FROM \"AdditionalDocuments\";
"
EOF

# Step 3: Download exported data from server
echo "📥 Downloading exported data from server..."
scp -P "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST:/tmp/*_export.csv" "$BACKUP_DIR/"

# Step 4: Convert CSV data to SQLite-compatible format and import
echo "🔄 Converting and importing data to local SQLite database..."

# Create Python script for data conversion and import
cat > "$BACKUP_DIR/import_data.py" << 'PYTHON_EOF'
import sqlite3
import csv
import os
from datetime import datetime

def parse_datetime(dt_str):
    if not dt_str or dt_str == 'NULL':
        return None
    try:
        return datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
    except:
        return None

def import_users(cursor, csv_file):
    print(f"Importing users from {csv_file}...")
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cursor.execute('''
                INSERT OR REPLACE INTO User (id, email, password, name, role, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                row['id'],
                row['email'],
                row['password'],
                row['name'],
                row['role'],
                parse_datetime(row['created_at']),
                parse_datetime(row['updated_at'])
            ))
    print(f"✅ Users imported successfully")

def import_applications(cursor, csv_file):
    print(f"Importing applications from {csv_file}...")
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
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
                row['other_education'],
                row['professional_context'],
                row['other_context'],
                row['expected_contribution'],
                row['other_contribution'],
                row['project_type'],
                row['project_area'],
                row['other_project_area'],
                row['project_summary'],
                row['project_motivation'],
                row['cv_file_url'],
                row['status'],
                row['email'],
                row['first_name'],
                row['gender'],
                row['last_name'],
                row['middle_name'],
                row['nationality'],
                row['title'],
                parse_datetime(row['created_at']),
                row['rejection_reason'],
                parse_datetime(row['submitted_at'])
            ))
    print(f"✅ Applications imported successfully")

def import_additional_documents(cursor, csv_file):
    print(f"Importing additional documents from {csv_file}...")
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
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
                row['achievements'],
                row['degree_certifications'],
                row['full_project_proposal'],
                row['funding_plan'],
                row['identity_document'],
                row['language_proficiency'],
                row['reference_one'],
                row['reference_two'],
                row['risk_mitigation'],
                parse_datetime(row['submitted_at'])
            ))
    print(f"✅ Additional documents imported successfully")

def main():
    # Connect to local SQLite database
    db_path = '../dev.db'
    if not os.path.exists(db_path):
        print(f"❌ Local database not found: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get current record counts
        cursor.execute("SELECT COUNT(*) FROM User")
        users_before = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Application")
        applications_before = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM AdditionalDocuments")
        docs_before = cursor.fetchone()[0]
        
        print(f"📊 Current local database counts:")
        print(f"   Users: {users_before}")
        print(f"   Applications: {applications_before}")
        print(f"   Additional Documents: {docs_before}")
        
        # Import data from CSV files
        csv_dir = '.'
        
        users_file = os.path.join(csv_dir, 'users_export.csv')
        if os.path.exists(users_file):
            import_users(cursor, users_file)
        
        applications_file = os.path.join(csv_dir, 'applications_export.csv')
        if os.path.exists(applications_file):
            import_applications(cursor, applications_file)
        
        additional_docs_file = os.path.join(csv_dir, 'additional_documents_export.csv')
        if os.path.exists(additional_docs_file):
            import_additional_documents(cursor, additional_docs_file)
        
        # Get final record counts
        cursor.execute("SELECT COUNT(*) FROM User")
        users_after = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Application")
        applications_after = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM AdditionalDocuments")
        docs_after = cursor.fetchone()[0]
        
        print(f"\n📊 Final local database counts:")
        print(f"   Users: {users_after} (+{users_after - users_before})")
        print(f"   Applications: {applications_after} (+{applications_after - applications_before})")
        print(f"   Additional Documents: {docs_after} (+{docs_after - docs_before})")
        
        # Commit changes
        conn.commit()
        print("\n✅ Data import completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during import: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()
PYTHON_EOF

# Step 5: Run the import script
echo "🔄 Running data import script..."
cd "$BACKUP_DIR"
python3 import_data.py
cd ..

# Step 6: Verify the import
echo "🔍 Verifying data import..."
sqlite3 "$LOCAL_DB_PATH" << 'SQL_EOF'
.headers on
.mode column
SELECT 'User' as table_name, COUNT(*) as count FROM User
UNION ALL
SELECT 'Application' as table_name, COUNT(*) as count FROM Application
UNION ALL
SELECT 'AdditionalDocuments' as table_name, COUNT(*) as count FROM AdditionalDocuments;
SQL_EOF

# Step 7: Cleanup temporary files on server
echo "🧹 Cleaning up temporary files on server..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "rm -f /tmp/*_export.csv /tmp/export_data.sql"

echo ""
echo "🎉 Data sync completed successfully!"
echo "=========================================="
echo "📁 Backup files saved in: $BACKUP_DIR"
echo "💾 Local database updated: $LOCAL_DB_PATH"
echo "🔄 Your local environment now has all server data!"
echo ""
echo "⚠️  Important: Keep the backup files safe in case you need to restore"
echo "   the previous local data."
