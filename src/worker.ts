import { Worker } from 'bullmq';
import { getEnvConfig } from './config/env.config';

async function bootstrapWorker() {
  const config = getEnvConfig();
  const connection = { host: config.redisHost, port: config.redisPort };

  console.log(`⚙️ Starting standalone BullMQ Worker connected to Redis ${config.redisHost}:${config.redisPort}...`);

  const worker = new Worker(
    'notifications',
    async (job) => {
      if (job.name === 'SEND_KITTY_REMINDER') {
        console.log(`📩 [Worker] Processing Kitty installment reminder for user: ${job.data.userId}`);
      } else if (job.name === 'SEND_ORDER_CONFIRMATION') {
        console.log(`📩 [Worker] Processing Order confirmation email for order: ${job.data.orderNumber}`);
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ [Worker] Job ${job.id} (${job.name}) completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [Worker] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 Shutting down BullMQ worker...');
    await worker.close();
    process.exit(0);
  });
}

bootstrapWorker();
