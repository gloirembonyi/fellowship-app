# PostgreSQL Setup Guide

This guide will help you fix your PostgreSQL installation and switch your application from SQLite to PostgreSQL.

## Current Status

Your application is currently using SQLite for local development, which is working correctly. However, you want to switch to PostgreSQL for production use.

## Fixing PostgreSQL Installation

You have PostgreSQL 13 installed on your system, but there are issues with authentication. Here are some steps to fix it:

### Option 1: Reinstall PostgreSQL

1. Download the PostgreSQL installer from the official website:
   https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. Choose PostgreSQL 13 for macOS and download the installer.

3. Run the installer and follow the prompts.

4. When asked for the password for the `postgres` user, set it to `230620` (or any password you prefer).

5. Complete the installation.

### Option 2: Reset PostgreSQL Password

1. Stop the PostgreSQL server:

   ```bash
   sudo pkill -f postgres
   ```

2. Edit the PostgreSQL configuration to allow password-less connections:

   ```bash
   sudo cp /Library/PostgreSQL/13/data/pg_hba.conf /Library/PostgreSQL/13/data/pg_hba.conf.bak
   sudo sh -c "echo 'local   all             all                                     trust' > /Library/PostgreSQL/13/data/pg_hba.conf"
   sudo sh -c "echo 'host    all             all             127.0.0.1/32            trust' >> /Library/PostgreSQL/13/data/pg_hba.conf"
   sudo sh -c "echo 'host    all             all             ::1/128                 trust' >> /Library/PostgreSQL/13/data/pg_hba.conf"
   ```

3. Start the PostgreSQL server:

   ```bash
   sudo -u postgres /Library/PostgreSQL/13/bin/pg_ctl -D /Library/PostgreSQL/13/data start
   ```

4. Reset the password for the `postgres` user:

   ```bash
   export PATH=$PATH:/Library/PostgreSQL/13/bin
   psql -U postgres -c "ALTER USER postgres WITH PASSWORD '230620';"
   ```

5. Restore the original configuration:

   ```bash
   sudo cp /Library/PostgreSQL/13/data/pg_hba.conf.bak /Library/PostgreSQL/13/data/pg_hba.conf
   ```

6. Restart PostgreSQL:
   ```bash
   sudo -u postgres /Library/PostgreSQL/13/bin/pg_ctl -D /Library/PostgreSQL/13/data restart
   ```

### Option 3: Use Postgres.app

If the above options don't work, you can try using Postgres.app, which is a simpler way to run PostgreSQL on macOS:

1. Download Postgres.app from https://postgresapp.com/

2. Install it by dragging it to your Applications folder.

3. Start Postgres.app and initialize a new server.

4. Update your connection string to use the Postgres.app server.

## Switching to PostgreSQL

Once you have PostgreSQL working correctly, follow these steps to switch your application from SQLite to PostgreSQL:

1. Create a new database for your application:

   ```bash
   export PATH=$PATH:/Library/PostgreSQL/13/bin
   psql -U postgres -c "CREATE DATABASE fellowship_program;"
   ```

2. Update your `prisma/schema.prisma` file:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Update your `.env` file:

   ```
   DATABASE_URL="postgresql://postgres:230620@localhost:5432/fellowship_program"
   DATABASE_URL_AUTHENTICATED="postgresql://postgres:230620@localhost:5432/fellowship_program"
   ```

4. Push your schema to the new database:

   ```bash
   npx prisma db push
   ```

5. Seed the database with sample data:

   ```bash
   # Start the development server first
   npm run dev

   # In another terminal, run:
   curl -X POST http://localhost:3000/api/admin/seed
   ```

## Verifying the Connection

To verify that your application is connected to PostgreSQL:

1. Start the development server:

   ```bash
   npm run dev
   ```

2. In another terminal, check the database connection:

   ```bash
   export PATH=$PATH:/Library/PostgreSQL/13/bin
   psql -U postgres -d fellowship_program -c "SELECT COUNT(*) FROM \"Application\";"
   ```

3. You should see the count of applications in your database.

## Troubleshooting

If you encounter issues:

1. Check if PostgreSQL is running:

   ```bash
   ps aux | grep postgres
   ```

2. Check if you can connect to PostgreSQL:

   ```bash
   export PATH=$PATH:/Library/PostgreSQL/13/bin
   psql -U postgres -c "SELECT version();"
   ```

3. Check the PostgreSQL logs:

   ```bash
   sudo tail -f /Library/PostgreSQL/13/data/log/postgresql-*.log
   ```

4. If all else fails, you can continue using SQLite for development, which is working correctly.
