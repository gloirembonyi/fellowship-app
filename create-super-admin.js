const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

// Create readline interface for secure input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to securely get password input
function getPassword(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeAllListeners('data');
          console.log('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function main() {
  try {
    console.log('👑 Super Admin Creation Tool');
    console.log('============================\n');
    
    // Get super admin details
    const name = await new Promise((resolve) => {
      rl.question('Enter super admin name: ', resolve);
    });
    
    const email = await new Promise((resolve) => {
      rl.question('Enter super admin email: ', resolve);
    });
    
    if (!name || !email) {
      console.log('❌ Name and email are required');
      process.exit(1);
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      
      const update = await new Promise((resolve) => {
        rl.question('Do you want to update this user to super admin? (y/N): ', resolve);
      });
      
      if (update.toLowerCase() !== 'y' && update.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled');
        process.exit(0);
      }
    }
    
    // Get password securely
    const password = await getPassword('Enter password: ');
    
    if (!password || password.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      process.exit(1);
    }
    
    // Confirm password
    const confirmPassword = await getPassword('Confirm password: ');
    
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      process.exit(1);
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create or update super admin
    const superAdmin = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
        role: 'super_admin'
      },
      create: {
        name,
        email,
        password: hashedPassword,
        role: 'super_admin'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('\n✅ Super admin created/updated successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Name:', superAdmin.name);
    console.log('👑 Role:', superAdmin.role);
    console.log('🆔 ID:', superAdmin.id);
    console.log('📅 Created:', superAdmin.createdAt);
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n❌ Operation cancelled');
  process.exit(0);
});

main();

