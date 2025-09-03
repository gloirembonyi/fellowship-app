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
    console.log('🔐 Super Admin Password Reset Tool');
    console.log('=====================================\n');
    
    // Get super admin email
    const email = await new Promise((resolve) => {
      rl.question('Enter super admin email: ', resolve);
    });
    
    if (!email) {
      console.log('❌ Email is required');
      process.exit(1);
    }
    
    // Check if super admin exists
    const superAdmin = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (!superAdmin) {
      console.log('❌ Super admin with this email not found');
      process.exit(1);
    }
    
    if (superAdmin.role !== 'super_admin') {
      console.log('❌ User is not a super admin');
      process.exit(1);
    }
    
    console.log(`✅ Found super admin: ${superAdmin.name} (${superAdmin.email})`);
    
    // Get new password securely
    const newPassword = await getPassword('Enter new password: ');
    
    if (!newPassword || newPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      process.exit(1);
    }
    
    // Confirm password
    const confirmPassword = await getPassword('Confirm new password: ');
    
    if (newPassword !== confirmPassword) {
      console.log('❌ Passwords do not match');
      process.exit(1);
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the password
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Super admin password reset successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Name:', superAdmin.name);
    console.log('🔑 New password has been set');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
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

