import { Queue, Worker, Job } from 'bullmq';
import { processSupplyChainEvent, SupplyChainEventPayload } from '../services/ruleEngine.js';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379
};

export const EXCEPTION_QUEUE_NAME = 'exception-events';

export const exceptionQueue = new Queue<SupplyChainEventPayload>(EXCEPTION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, 
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100, 
    removeOnFail: 200
  }
});

export function initExceptionWorker(io: SocketIOServer): Worker {
  const worker = new Worker<SupplyChainEventPayload>(
    EXCEPTION_QUEUE_NAME,
    async (job: Job<SupplyChainEventPayload>) => {
      const createdException = await processSupplyChainEvent(job.data, io);
      return {
        processedAt: new Date().toISOString(),
        exceptionCode: createdException ? createdException.exceptionCode : 'NO_EXCEPTION_TRIGGERED'
      };
    },
    {
      connection: redisConnection,
      concurrency: 10 // Process up to 10 DAG traversals in parallel
    }
  );

  worker.on('completed', (job, returnvalue) => {
    console.log(`[BullMQ Worker] Job ${job.id} completed ->`, returnvalue.exceptionCode);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log('[BullMQ Worker] Listening for supply chain events (Concurrency: 10)');
  return worker;
}