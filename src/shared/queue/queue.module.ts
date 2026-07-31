import { Global, Module } from '@nestjs/common';
import { BullMQQueueService } from './bullmq.service';

@Global()
@Module({
  providers: [BullMQQueueService],
  exports: [BullMQQueueService],
})
export class QueueModule {}
