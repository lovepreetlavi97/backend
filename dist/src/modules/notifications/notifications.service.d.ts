import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUserNotifications(userId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
    }[]>;
    markAsRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    createNotification(userId: string, title: string, message: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
    }>;
}
