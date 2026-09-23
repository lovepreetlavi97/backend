import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(): Promise<{
        status: string;
        data: {
            totalUsers: number;
            totalOrders: number;
            totalProducts: number;
            activeKitties: number;
            totalRevenue: number;
            recentOrders: ({
                user: {
                    id: string;
                    email: string;
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string | null;
                items: import("@prisma/client/runtime/library").JsonValue;
                orderNumber: string;
                guestName: string | null;
                guestEmail: string | null;
                guestPhone: string | null;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                discountAmount: import("@prisma/client/runtime/library").Decimal;
                finalAmount: import("@prisma/client/runtime/library").Decimal;
                orderStatus: import(".prisma/client").$Enums.OrderStatus;
                paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
                shippingAddress: import("@prisma/client/runtime/library").JsonValue;
                razorpayOrderId: string | null;
            })[];
        };
    }>;
}
export declare class AdminDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getCounts(): Promise<{
        status: string;
        statusCode: number;
        data: {
            users: number;
            categories: number;
            subcategories: number;
            relations: number;
            products: number;
            festivals: number;
            orders: number;
            refunds: number;
            revenue: number;
            carts: number;
            contactQueries: number;
            wishlistItems: number;
        };
    }>;
    getPerformance(): Promise<{
        status: string;
        statusCode: number;
        data: {
            year: number;
            months: {
                month: string;
                orders: number;
                users: number;
                revenue: number;
            }[];
        };
    }>;
}
