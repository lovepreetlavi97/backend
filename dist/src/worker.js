"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const env_config_1 = require("./config/env.config");
async function bootstrapWorker() {
    const config = (0, env_config_1.getEnvConfig)();
    const connection = { host: config.redisHost, port: config.redisPort };
    console.log(`⚙️ Starting standalone BullMQ Worker connected to Redis ${config.redisHost}:${config.redisPort}...`);
    const worker = new bullmq_1.Worker('notifications', async (job) => {
        if (job.name === 'SEND_KITTY_REMINDER') {
            console.log(`📩 [Worker] Processing Kitty installment reminder for user: ${job.data.userId}`);
        }
        else if (job.name === 'SEND_ORDER_CONFIRMATION') {
            console.log(`📩 [Worker] Processing Order confirmation email for order: ${job.data.orderNumber}`);
        }
    }, {
        connection,
        concurrency: 5,
    });
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
//# sourceMappingURL=worker.js.map