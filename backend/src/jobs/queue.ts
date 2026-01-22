import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config.js';
import { scrapeWorker } from './workers/scrape.worker.js';

// Create Redis connection
const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

// Create the scrape queue
export const scrapeQueue = new Queue('scrape', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 60 * 60, // 24 hours
    },
    removeOnFail: {
      count: 50,
    },
  },
});

// Create the worker
export const worker = new Worker('scrape', scrapeWorker, {
  connection,
  concurrency: 2, // Only 2 concurrent scrape jobs to avoid rate limiting
});

// Worker event handlers
worker.on('completed', (job: Job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job: Job | undefined, error: Error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

worker.on('error', (error: Error) => {
  console.error('Worker error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await scrapeQueue.close();
  connection.disconnect();
});
