import { PaymentsService } from './payments.service';
export interface VerifyPaymentDto {
    orderId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    signature?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
}
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createPaymentOrder(body: {
        amount: number;
        orderId: string;
    }): Promise<{
        order: any;
        status: string;
    }>;
    verifyPayment(dto: VerifyPaymentDto): Promise<{
        status: string;
        message: string;
        data: {
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
        };
    }>;
}
