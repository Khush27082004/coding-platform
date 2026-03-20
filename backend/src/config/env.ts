import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DOCKER_ENABLED: z.string().default('true'),
  CODE_TIMEOUT: z.string().default('10000'),
  MAX_MEMORY: z.string().default('256'),
  RATE_LIMIT_WINDOW: z.string().default('60000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = {
  NODE_ENV: parsed.data.NODE_ENV,
  PORT: parseInt(parsed.data.PORT, 10),
  DATABASE_URL: parsed.data.DATABASE_URL,
  REDIS_URL: parsed.data.REDIS_URL,
  JWT_SECRET: parsed.data.JWT_SECRET,
  JWT_EXPIRES_IN: parsed.data.JWT_EXPIRES_IN,
  DOCKER_ENABLED: parsed.data.DOCKER_ENABLED === 'true',
  CODE_TIMEOUT: parseInt(parsed.data.CODE_TIMEOUT, 10),
  MAX_MEMORY: parseInt(parsed.data.MAX_MEMORY, 10),
  RATE_LIMIT_WINDOW: parseInt(parsed.data.RATE_LIMIT_WINDOW, 10),
  RATE_LIMIT_MAX: parseInt(parsed.data.RATE_LIMIT_MAX, 10),
  CORS_ORIGIN: parsed.data.CORS_ORIGIN,
};
