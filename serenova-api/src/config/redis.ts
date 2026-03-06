import 'dotenv/config';

// Configuration Redis pour Bull queue
export const redisConfig = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
    password: process.env.REDIS_PASSWORD ?? undefined,
    // Retry on connection failure
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};
