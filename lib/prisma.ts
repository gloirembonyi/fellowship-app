import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma client with connection retry logic
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: ['error', 'warn', 'info', 'query'],
    errorFormat: 'pretty',
  });

  return client;
};

// Use existing client or create a new one
export const prisma = globalForPrisma.prisma || createPrismaClient();

// Function to test the database connection
const testConnection = async (retries = 5, delay = 2000) => {
  let currentTry = 0;
  
  while (currentTry < retries) {
    try {
      console.log(`Database connection attempt ${currentTry + 1}/${retries} with URL: ${process.env.DATABASE_URL?.replace(/\/\/([^:]+):([^@]+)@/, '//********:********@')}`);
      // Simple query to test the connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('Successfully connected to the database');
      return true;
    } catch (e) {
      currentTry++;
      console.error(`Database connection attempt ${currentTry}/${retries} failed:`, e);
      
      // Log more details about the error
      if (e instanceof Error) {
        console.error(`Error name: ${e.name}`);
        console.error(`Error message: ${e.message}`);
        console.error(`Error stack: ${e.stack}`);
        
        // Check for specific error types
        if (e.message.includes('authentication')) {
          console.error('This appears to be an authentication error. Check your database credentials.');
        } else if (e.message.includes('connect')) {
          console.error('This appears to be a connection error. Check your database host and network.');
        }
      }
      
      if (currentTry >= retries) {
        console.error('Maximum connection retries reached. Database might be unavailable.');
        return false;
      }
      
      // Wait before retrying
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

// Test the connection when the module is loaded
testConnection().catch(e => {
  console.error('Failed to establish database connection:', e);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT signal, closing Prisma connection');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal, closing Prisma connection');
  await prisma.$disconnect();
  process.exit(0);
});

// Save to global in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 