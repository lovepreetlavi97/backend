import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(userId: string): Promise<{
        status: string;
        data: {
            notifications: {
                id: string;
                createdAt: Date;
                title: string;
                userId: string;
                message: string;
                isRead: boolean;
            }[];
        };
    }>;
    markRead(notificationId: string, userId: string): Promise<{
        status: string;
        message: string;
    }>;
}
