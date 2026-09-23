import { PrismaService } from '../prisma/prisma.service';
export interface CreateOrderDto {
    userId?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    shippingAddress: any;
}
export declare class OrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createOrder(dto: CreateOrderDto): Promise<{
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
    }>;
    getUserOrders(userId: string): Promise<{
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
    }[]>;
    getOrderByNumber(orderNumber: string): Promise<{
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
    }>;
}
