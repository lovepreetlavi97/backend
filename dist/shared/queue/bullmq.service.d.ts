import { OnModuleInit } from '@nestjs/common';
export declare class BullMQQueueService implements OnModuleInit {
    private notificationQueue;
    private connection;
    constructor();
    onModuleInit(): Promise<void>;
    addKittyReminderJob(userId: string, userKittyId: string): Promise<void>;
    addOrderConfirmationJob(orderNumber: string, userEmail: string): Promise<void>;
}
