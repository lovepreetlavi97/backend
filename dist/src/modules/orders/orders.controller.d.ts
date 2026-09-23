import { OrdersService, CreateOrderDto } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(req: any, dto: CreateOrderDto): Promise<{
        status: string;
        message: string;
        data: {
            order: {
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
            };
        };
    }>;
    trackOrder(orderNumber: string): Promise<{
        status: string;
        data: {
            order: {
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
            };
        };
    }>;
    getUserOrders(userId: string, user: any): Promise<{
        status: string;
        data: {
            orders: {
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
            }[];
        };
    }>;
}
