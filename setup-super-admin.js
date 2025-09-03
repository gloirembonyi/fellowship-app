const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔐 Setting up Super Admin Account');
    console.log('================================\n');
    
    // Default super admin credentials
    const email = 'superadmin@health.gov.rw';
    const name = 'Super Administrator';
    const password = 'SuperAdmin@2025!';
    
    console.log('Creating super admin with default credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
    
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
    
    console.log('✅ Super admin created/updated successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Name:', superAdmin.name);
    console.log('👑 Role:', superAdmin.role);
    console.log('🆔 ID:', superAdmin.id);
    console.log('📅 Created:', superAdmin.createdAt);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Access the admin panel at: http://localhost:3001/admin');
    console.log('\n⚠️  SECURITY REMINDER:');
    console.log('   1. Change the default password immediately');
    console.log('   2. Use a strong, unique password');
    console.log('   3. Keep these credentials secure');
    console.log('   4. Only share with trusted administrators');
    
  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

