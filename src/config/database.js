import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import dotenv from 'dotenv';

// Load environment variables from backend .env file
dotenv.config();

// Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Test database connection
export const connectDatabase = async () => {
  try {
    // Test Prisma connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Using SQLite fallback database');
    return false;
  }
};

// Graceful shutdown
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database connections closed successfully.');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

export { prisma };