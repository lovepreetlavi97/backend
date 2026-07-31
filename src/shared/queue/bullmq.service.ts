import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { getEnvConfig } from '../../config/env.config';

@Injectable()
export class BullMQQueueService implements OnModuleInit {
  private notificationQueue: Queue;
  private connection: { host: string; port: number };

  constructor() {
    const config = getEnvConfig();
    this.connection = { host: config.redisHost, port: config.redisPort };
    this.notificationQueue = new Queue('notifications', { connection: this.connection });
  }

  async onModuleInit() {
    // Worker processing Kitty reminders and transactional emails
    new Worker(
      'notifications',
      async (job) => {
        if (job.name === 'SEND_KITTY_REMINDER') {
          console.log(`📩 Processing Kitty installment reminder for user: ${job.data.userId}`);
        } else if (job.name === 'SEND_ORDER_CONFIRMATION') {
          console.log(`📩 Processing Order confirmation email for order: ${job.data.orderNumber}`);
        }
      },
      { connection: this.connection }
    );
  }

  async addKittyReminderJob(userId: string, userKittyId: string) {
    await this.notificationQueue.add('SEND_KITTY_REMINDER', { userId, userKittyId }, { attempts: 3, backoff: 5000 });
  }

  async addOrderConfirmationJob(orderNumber: string, userEmail: string) {
    await this.notificationQueue.add('SEND_ORDER_CONFIRMATION', { orderNumber, userEmail }, { attempts: 3 });
  }
}
