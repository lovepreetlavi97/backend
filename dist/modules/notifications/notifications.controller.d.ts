import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: any, pageStr?: string, limitStr?: string, isReadStr?: string): Promise<{
        status: string;
        data: {
            notifications: {
                _id: string;
                id: string;
                title: string;
                message: string;
                isRead: boolean;
                createdAt: string;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    markRead(notificationId: string): Promise<{
        status: string;
        message: string;
    }>;
    markReadAll(): Promise<{
        status: string;
        message: string;
    }>;
}
export declare class AdminNotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(pageStr?: string, limitStr?: string, isReadStr?: string): Promise<{
        status: string;
        data: {
            notifications: {
                _id: string;
                id: string;
                title: string;
                message: string;
                isRead: boolean;
                createdAt: string;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    markRead(notificationId: string): Promise<{
        status: string;
        message: string;
    }>;
    markReadAll(): Promise<{
        status: string;
        message: string;
    }>;
}
