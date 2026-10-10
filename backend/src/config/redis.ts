import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

// (for helping me) Shared Redis client for Idempotency (SETNX) and caching
export const redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected to Redis server on port', redisPort);
});

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});