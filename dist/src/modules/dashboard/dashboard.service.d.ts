import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAdminAnalytics(): Promise<{
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
    }>;
    getCounts(): Promise<{
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
    }>;
    getPerformance(): Promise<{
        year: number;
        months: {
            month: string;
            orders: number;
            users: number;
            revenue: number;
        }[];
    }>;
}
