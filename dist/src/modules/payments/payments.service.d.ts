import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
export declare class PaymentsService {
    private readonly prisma;
    private readonly redis;
    private readonly razorpaySecret;
    private readonly razorpay;
    constructor(prisma: PrismaService, redis: RedisService);
    verifySignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean;
    processPaymentVerification(orderId: string | undefined, razorpayOrderId: string, razorpayPaymentId: string, signature: string): Promise<{
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
        transaction: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string | null;
            paymentId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            gatewayResponse: import("@prisma/client/runtime/library").JsonValue | null;
        };
    } | {
        userKitty: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            userId: string;
            planId: string;
            paidMonths: number;
            totalAccumulated: import("@prisma/client/runtime/library").Decimal;
            nextDueDate: Date;
        };
        transaction: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string | null;
            paymentId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            gatewayResponse: import("@prisma/client/runtime/library").JsonValue | null;
        };
    } | {
        message: string;
        order: any;
        transaction: any;
        userKitty?: undefined;
    } | {
        message: string;
        userKitty: {
            plan: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                description: string | null;
                totalMonths: number;
                monthlyAmount: import("@prisma/client/runtime/library").Decimal;
                bonusMonths: import("@prisma/client/runtime/library").Decimal;
                metalType: import(".prisma/client").$Enums.MetalType;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            userId: string;
            planId: string;
            paidMonths: number;
            totalAccumulated: import("@prisma/client/runtime/library").Decimal;
            nextDueDate: Date;
        };
        order?: undefined;
        transaction?: undefined;
    }>;
    createRazorpayOrder(amount: number, orderId: string): Promise<{
        order: any;
    }>;
}
