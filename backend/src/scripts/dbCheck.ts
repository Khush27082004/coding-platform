import prisma from '../config/database';
import { logger } from '../utils/logger';

async function checkConnection() {
  console.log('🔍 Testing database connection...');
  try {
    // Attempt a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!');
    
    // Check migrations status (optional, but good to know)
    const usersCount = await prisma.user.count();
    console.log(`📊 Current user count: ${usersCount}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error('Error Name:', error.name);
    console.error('Error Code:', error.code);
    console.error('Message:', error.message);
    
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n💡 HINT: Your Supabase project might be paused or the Project ID in DATABASE_URL is incorrect.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
