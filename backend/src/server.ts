import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/database';
import redis from './config/redis';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Test Redis connection (optional)
    if (redis) {
      try {
        await redis.ping();
        logger.info('✅ Redis connected');
      } catch (error) {
        logger.info('⚠️  Redis not available (optional)');
      }
    } else {
      logger.info('⚠️  Redis not available (optional)');
    }

    // Start server
    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${env.PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
});

startServer();
