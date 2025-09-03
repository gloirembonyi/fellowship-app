const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Read the admin user data from the JSON file
const adminUser = JSON.parse(fs.readFileSync('./admin-user.json', 'utf8'));

// Open the SQLite database
const db = new sqlite3.Database('./dev.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Insert the admin user
db.serialize(() => {
  // Check if the User table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='User'", (err, row) => {
    if (err) {
      console.error('Error checking if User table exists:', err.message);
      db.close();
      process.exit(1);
    }

      console.log('User table does not exist. Creating it...');
      db.run("CREATE TABLE User (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT, role TEXT NOT NULL DEFAULT 'user', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL)", (err) => {
        if (err) {
          console.error('Error creating User table:', err.message);
          db.close();
          process.exit(1);
        }
        insertUser();
      });
    } else {
      insertUser();
    }
  });
});

function insertUser() {
  // Check if the user already exists
  db.get("SELECT * FROM User WHERE email = ?", [adminUser.email], (err, row) => {
    if (err) {
      console.error('Error checking if user exists:', err.message);
      db.close();
      process.exit(1);
    }

    if (row) {
      console.log('User already exists. Updating...');
      db.run(
        "UPDATE User SET password = ?, role = ?, name = ?, updatedAt = ? WHERE email = ?",
        [adminUser.password, adminUser.role, adminUser.name, adminUser.updatedAt, adminUser.email],
        function(err) {
          if (err) {
            console.error('Error updating user:', err.message);
          } else {
            console.log('User updated successfully');
          }
          db.close();
        }
      );
    } else {
      console.log('User does not exist. Inserting...');
      db.run(
        "INSERT INTO User (id, email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [adminUser.id, adminUser.email, adminUser.password, adminUser.name, adminUser.role, adminUser.createdAt, adminUser.updatedAt],
        function(err) {
          if (err) {
            console.error('Error inserting user:', err.message);
          } else {
            console.log('User inserted successfully');
          }
          db.close();
        }
      );
    }
  });
}
