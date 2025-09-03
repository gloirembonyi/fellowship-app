import sqlite3
import os
from datetime import datetime

def merge_databases(local_db_path, server_db_path, backup_dir):
    print("🔄 Starting database merge...")
    
    # Connect to both databases
    local_conn = sqlite3.connect(local_db_path)
    server_conn = sqlite3.connect(server_db_path)
    
    local_cursor = local_conn.cursor()
    server_cursor = server_conn.cursor()
    
    try:
        # Get counts before merge
        local_cursor.execute("SELECT COUNT(*) FROM User")
        local_users_before = local_cursor.fetchone()[0]
        local_cursor.execute("SELECT COUNT(*) FROM Application")
        local_apps_before = local_cursor.fetchone()[0]
        local_cursor.execute("SELECT COUNT(*) FROM AdditionalDocuments")
        local_docs_before = local_cursor.fetchone()[0]
        
        server_cursor.execute("SELECT COUNT(*) FROM User")
        server_users = server_cursor.fetchone()[0]
        server_cursor.execute("SELECT COUNT(*) FROM Application")
        server_apps = server_cursor.fetchone()[0]
        server_cursor.execute("SELECT COUNT(*) FROM AdditionalDocuments")
        server_docs = server_cursor.fetchone()[0]
        
        print(f"📊 Before merge:")
        print(f"   Local - Users: {local_users_before}, Apps: {local_apps_before}, Docs: {local_docs_before}")
        print(f"   Server - Users: {server_users}, Apps: {server_apps}, Docs: {server_docs}")
        
        # Merge Users table (INSERT OR REPLACE to avoid duplicates)
        print("\n🔄 Merging Users table...")
        server_cursor.execute("SELECT * FROM User")
        users = server_cursor.fetchall()
        
        for user in users:
            local_cursor.execute('''
                INSERT OR REPLACE INTO User (id, email, password, name, role, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', user)
        
        print(f"✅ Users merged: {len(users)} records")
        
        # Merge Applications table
        print("🔄 Merging Applications table...")
        server_cursor.execute("SELECT * FROM Application")
        applications = server_cursor.fetchall()
        
        for app in applications:
            local_cursor.execute('''
                INSERT OR REPLACE INTO Application (
                    id, updatedAt, countryOfResidence, phone, address, workplace, position,
                    educationLevel, otherEducation, professionalContext, otherContext,
                    expectedContribution, otherContribution, projectType, projectArea,
                    otherProjectArea, projectSummary, projectMotivation, cvFileUrl,
                    status, email, firstName, gender, lastName, middleName,
                    nationality, title, createdAt, rejectionReason, submittedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', app)
        
        print(f"✅ Applications merged: {len(applications)} records")
        
        # Merge AdditionalDocuments table
        print("🔄 Merging AdditionalDocuments table...")
        server_cursor.execute("SELECT * FROM AdditionalDocuments")
        documents = server_cursor.fetchall()
        
        for doc in documents:
            local_cursor.execute('''
                INSERT OR REPLACE INTO AdditionalDocuments (
                    id, applicationId, submissionStatus, createdAt, updatedAt,
                    achievements, degreeCertifications, fullProjectProposal,
                    fundingPlan, identityDocument, languageProficiency,
                    referenceOne, referenceTwo, riskMitigation, submittedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', doc)
        
        print(f"✅ Additional documents merged: {len(documents)} records")
        
        # Get final counts
        local_cursor.execute("SELECT COUNT(*) FROM User")
        local_users_after = local_cursor.fetchone()[0]
        local_cursor.execute("SELECT COUNT(*) FROM Application")
        local_apps_after = local_cursor.fetchone()[0]
        local_cursor.execute("SELECT COUNT(*) FROM AdditionalDocuments")
        local_docs_after = local_cursor.fetchone()[0]
        
        print(f"\n📊 After merge:")
        print(f"   Local - Users: {local_users_after} (+{local_users_after - local_users_before})")
        print(f"   Local - Apps: {local_apps_after} (+{local_apps_after - local_apps_before})")
        print(f"   Local - Docs: {local_docs_after} (+{local_docs_after - local_docs_before})")
        
        # Commit changes
        local_conn.commit()
        print("\n✅ Database merge completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during merge: {e}")
        local_conn.rollback()
        raise
    finally:
        local_conn.close()
        server_conn.close()

if __name__ == "__main__":
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Paths relative to script directory
    local_db = os.path.join(script_dir, "..", "dev.db")
    server_db = os.path.join(script_dir, f"server_db_{datetime.now().strftime('%Y%m%d_%H%M%S')[:-3]}.db")
    
    if not os.path.exists(local_db):
        print(f"❌ Local database not found: {local_db}")
        exit(1)
    
    if not os.path.exists(server_db):
        print(f"❌ Server database not found: {server_db}")
        exit(1)
    
    merge_databases(local_db, server_db, script_dir)
