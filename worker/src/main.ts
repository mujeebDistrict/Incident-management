import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

const worker = new Worker(
  'notificationQueue',
  async (job) => {
    console.log(`[worker] processing job ${job.id}:`, job.data);

    const { incidentId, userId, message } = job.data;

    await prisma.notification.create({
      data: {
        incidentId,
        userId,
        message,
      },
    });

    console.log(`[worker] notification created for user ${userId}`);
  },
  { connection },
);

worker.on('ready', () => console.log('[worker] connected, listening on notificationQueue'));
worker.on('failed', (job, err) => console.error(`[worker] job ${job?.id} failed:`, err));

process.on('SIGTERM', async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});