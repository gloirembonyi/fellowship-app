// scripts/create-user.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Get user credentials from environment variables
    const email = process.env.USER_EMAIL;
    const password = process.env.USER_PASSWORD;
    
    if (!email || !password) {
      console.error('❌ USER_EMAIL or USER_PASSWORD not found in environment variables');
      process.exit(1);
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`User with email ${email} already exists. Updating password...`);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update the user
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      
      console.log('✅ User password updated successfully');
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create the user
      await prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          password: hashedPassword,
          name: 'Fellowship User',
          role: 'user',
        }
      });
      
      console.log(`✅ User created successfully with email: ${email}`);
    }
  } catch (error) {
    console.error('❌ Error creating/updating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUser(); 