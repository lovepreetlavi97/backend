import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { EmailService } from '../email/email.service';
export declare class PaymentsService {
    private readonly prisma;
    private readonly redis;
    private readonly emailService;
    private readonly razorpaySecret;
    private readonly razorpay;
    constructor(prisma: PrismaService, redis: RedisService, emailService: EmailService);
    verifySignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean;
    processPaymentVerification(orderId: string | undefined, razorpayOrderId: string, razorpayPaymentId: string, signature: string): Promise<{
        order: {
            id: string;
            orderNumber: string;
            razorpayOrderId: string | null;
            userId: string | null;
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
            createdAt: Date;
            updatedAt: Date;
        };
        transaction: {
            id: string;
            createdAt: Date;
            paymentId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            gatewayResponse: import("@prisma/client/runtime/library").JsonValue | null;
            orderId: string | null;
        };
    } | {
        userKitty: {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            planId: string;
            paidMonths: number;
            totalAccumulated: import("@prisma/client/runtime/library").Decimal;
            nextDueDate: Date;
        };
        transaction: {
            id: string;
            createdAt: Date;
            paymentId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            gatewayResponse: import("@prisma/client/runtime/library").JsonValue | null;
            orderId: string | null;
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
                createdAt: Date;
                name: string;
                totalMonths: number;
                monthlyAmount: import("@prisma/client/runtime/library").Decimal;
                bonusMonths: import("@prisma/client/runtime/library").Decimal;
                metalType: import(".prisma/client").$Enums.MetalType;
                description: string | null;
                isActive: boolean;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
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
    getAllTransactions(query: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        transactions: ({
            order: {
                user: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    email: string;
                    phone: string | null;
                    password: string;
                    role: import(".prisma/client").$Enums.Role;
                    isDeleted: boolean;
                };
            } & {
                id: string;
                orderNumber: string;
                razorpayOrderId: string | null;
                userId: string | null;
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
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            paymentId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            gatewayResponse: import("@prisma/client/runtime/library").JsonValue | null;
            orderId: string | null;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
}
