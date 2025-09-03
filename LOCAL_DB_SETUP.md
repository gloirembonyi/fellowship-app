# Local Database Setup

This guide will help you set up a local database for the Fellowship Program application.

## SQLite Setup (Current Configuration)

The application is currently configured to use SQLite for local development. This is a lightweight database that doesn't require a separate server, making it ideal for development.

### Advantages of SQLite for Development

- No installation required
- No configuration needed
- Works out of the box
- File-based, so it's easy to back up and restore

### How to Use

1. The database file is located at `prisma/dev.db`
2. You can view and manage the database using Prisma Studio:

   ```bash
   npx prisma studio
   ```

   This will open a web interface at http://localhost:5555

3. To reset the database:

   ```bash
   npx prisma db push --force-reset
   ```

4. To seed the database with sample data:

   ```bash
   # Start the development server first
   npm run dev

   # In another terminal, run:
   curl -X POST http://localhost:3000/api/admin/seed
   ```

## Switching Back to PostgreSQL (Production)

If you need to switch back to PostgreSQL (for example, for production), follow these steps:

1. Update the `prisma/schema.prisma` file:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update the `.env` file with your PostgreSQL connection string:

   ```
   DATABASE_URL="postgresql://postgres:230620@localhost:5432/fellowship_program"
   DATABASE_URL_AUTHENTICATED="postgresql://postgres:230620@localhost:5432/fellowship_program"
   ```

3. Push the schema to the PostgreSQL database:

   ```bash
   npx prisma db push
   ```

4. Seed the database:
   ```bash
   curl -X POST http://localhost:3000/api/admin/seed
   ```

## Troubleshooting

If you encounter any issues:

1. Check Prisma logs:

   ```bash
   npx prisma studio
   ```

2. Reset the database if needed:

   ```bash
   npx prisma db push --force-reset
   ```

3. Make sure your connection string in the `.env` file is correct
