#!/usr/bin/env python3

import sqlite3
import os
from datetime import datetime

def merge_databases():
    print("🚀 Starting robust database merge...")
    print("=" * 40)
    
    local_db = "dev.db"
    server_db = "server_db_backup.db"
    
    # Connect to both databases
    local_conn = sqlite3.connect(local_db)
    server_conn = sqlite3.connect(server_db)
    
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
        
        # Merge Users table
        print("\n🔄 Merging Users table...")
        server_cursor.execute("SELECT id, email, password, name, role, createdAt, updatedAt FROM User")
        users = server_cursor.fetchall()
        
        for user in users:
            local_cursor.execute('''
                INSERT OR REPLACE INTO User (id, email, password, name, role, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', user)
        
        print(f"✅ Users merged: {len(users)} records")
        
        # Merge Applications table using column names
        print("🔄 Merging Applications table...")
        server_cursor.execute("""
            SELECT id, updatedAt, countryOfResidence, phone, address, workplace, position,
                   educationLevel, otherEducation, professionalContext, otherContext,
                   expectedContribution, otherContribution, projectType, projectArea,
                   otherProjectArea, projectSummary, projectMotivation, cvFileUrl,
                   status, email, firstName, gender, lastName, middleName,
                   nationality, title, createdAt, rejectionReason, submittedAt
            FROM Application
        """)
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', app)
        
        print(f"✅ Applications merged: {len(applications)} records")
        
        # Merge AdditionalDocuments table
        print("🔄 Merging AdditionalDocuments table...")
        server_cursor.execute("""
            SELECT id, applicationId, submissionStatus, createdAt, updatedAt,
                   achievements, degreeCertifications, fullProjectProposal,
                   fundingPlan, identityDocument, languageProficiency,
                   referenceOne, referenceTwo, riskMitigation, submittedAt
            FROM AdditionalDocuments
        """)
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
        
        # Verify data integrity
        print("\n🔍 Verifying data integrity...")
        
        # Check for orphaned documents
        local_cursor.execute("""
            SELECT COUNT(*) FROM AdditionalDocuments ad 
            LEFT JOIN Application a ON ad.applicationId = a.id 
            WHERE a.id IS NULL
        """)
        orphaned_docs = local_cursor.fetchone()[0]
        
        if orphaned_docs > 0:
            print(f"⚠️  Warning: {orphaned_docs} orphaned additional documents found")
        else:
            print("✅ No orphaned documents found")
        
        # Check for duplicate emails
        local_cursor.execute("""
            SELECT email, COUNT(*) as count 
            FROM Application 
            GROUP BY email 
            HAVING COUNT(*) > 1
        """)
        duplicate_emails = local_cursor.fetchall()
        
        if duplicate_emails:
            print(f"⚠️  Warning: {len(duplicate_emails)} duplicate application emails found")
            for email, count in duplicate_emails:
                print(f"   {email}: {count} applications")
        else:
            print("✅ No duplicate application emails found")
        
        # Show some sample data
        print("\n📋 Sample merged data:")
        local_cursor.execute("SELECT email, firstName, lastName, status, createdAt FROM Application ORDER BY createdAt DESC LIMIT 5")
        samples = local_cursor.fetchall()
        for sample in samples:
            print(f"   {sample[0]} - {sample[1]} {sample[2]} ({sample[3]}) - {sample[4]}")
        
    except Exception as e:
        print(f"❌ Error during merge: {e}")
        local_conn.rollback()
        raise
    finally:
        local_conn.close()
        server_conn.close()

if __name__ == "__main__":
    merge_databases()
