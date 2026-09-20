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
                    name: string;
                    email: string;
                };
            } & {
                id: string;
                userId: string | null;
                createdAt: Date;
                updatedAt: Date;
                orderNumber: string;
                razorpayOrderId: string | null;
                guestName: string | null;
                guestEmail: string | null;
                guestPhone: string | null;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                discountAmount: import("@prisma/client/runtime/library").Decimal;
                finalAmount: import("@prisma/client/runtime/library").Decimal;
                orderStatus: import(".prisma/client").$Enums.OrderStatus;
                paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
                items: import("@prisma/client/runtime/library").JsonValue;
                shippingAddress: import("@prisma/client/runtime/library").JsonValue;
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
