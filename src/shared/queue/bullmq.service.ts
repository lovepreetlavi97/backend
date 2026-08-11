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
    // Queue producer initialized; worker execution is handled by standalone worker process.
  }

  async addKittyReminderJob(userId: string, userKittyId: string) {
    await this.notificationQueue.add('SEND_KITTY_REMINDER', { userId, userKittyId }, { attempts: 3, backoff: 5000 });
  }

  async addOrderConfirmationJob(orderNumber: string, userEmail: string) {
    await this.notificationQueue.add('SEND_ORDER_CONFIRMATION', { orderNumber, userEmail }, { attempts: 3 });
  }
}
