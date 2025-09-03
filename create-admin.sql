-- Create User table if it doesn't exist
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user
INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
VALUES ('cltcky0y10000zri1ws8hxlju', 'techdev925@gmail.com', 'b0/AE9PVwrLyWplBQdBCOg3cFG/d.GRJci5jST.IYvNhiB3YiJQe', 'Admin User', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO UPDATE SET
  "password" = 'b0/AE9PVwrLyWplBQdBCOg3cFG/d.GRJci5jST.IYvNhiB3YiJQe',
  "role" = 'admin';
