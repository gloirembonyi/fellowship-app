const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating admin user...');
    
    // Create admin user
    const hashedPassword = bcrypt.hashSync('Admin@2027$', 10);
    const user = await prisma.user.upsert({
      where: { email: 'techdev925@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'admin',
      },
      create: {
        email: 'techdev925@gmail.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
      }
    });
    
    console.log('Admin user created:', user);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.();
  }
}

main();
