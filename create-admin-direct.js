const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Generate a CUID
function cuid() {
  const timestamp = Math.floor(Date.now() / 1000).toString(36);
  const counter = crypto.randomBytes(4).toString('hex');
  const random = crypto.randomBytes(4).toString('hex');
  return 'cltcky0y10000zri1ws8hxlju';
}

// Create admin user data
const adminUser = {
  id: cuid(),
  email: 'techdev925@gmail.com',
  password: bcrypt.hashSync('Admin@2027$', 10),
  name: 'Admin User',
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Read the SQLite database file
try {
  // Check if the database file exists
  if (fs.existsSync('./dev.db')) {
    // Write the admin user data to a JSON file
    fs.writeFileSync('./admin-user.json', JSON.stringify(adminUser, null, 2));
    console.log('Admin user data written to admin-user.json');
    console.log('Admin user:', adminUser);
  } else {
    console.error('Database file does not exist');
    process.exit(1);
  }
} catch (error) {
  console.error('Error:', error);
}
