import { PrismaService } from '../prisma/prisma.service';
export interface CreateOrderDto {
    userId?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    items?: Array<{
        productId?: string;
        id?: string;
        _id?: string;
        quantity?: number;
    }>;
    products?: Array<{
        productId?: string;
        id?: string;
        _id?: string;
        quantity?: number;
    }>;
    shippingAddress: any;
    billingAddress?: any;
    paymentMethod?: string;
    paymentStatus?: string;
    totalAmount?: number;
    finalAmount?: number;
    shippingCharge?: number;
    discountAmount?: number;
    taxAmount?: number;
}
export declare class OrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createOrder(dto: CreateOrderDto): Promise<{
        _id: string;
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
    private mapOrder;
    findAllOrders(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        paymentStatus?: string;
        customerId?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        orders: {
            _id: any;
            id: any;
            orderNumber: any;
            userId: {
                _id: any;
                id: any;
                name: any;
                email: any;
                phone: any;
            } | {
                _id: any;
                name: any;
                email: any;
                phone: any;
                id?: undefined;
            };
            products: any;
            subtotal: number;
            shippingCharge: number;
            tax: number;
            taxAmount: number;
            totalAmount: number;
            discountAmount: number;
            finalAmount: number;
            status: any;
            orderStatus: any;
            paymentStatus: any;
            paymentMethod: string;
            shippingAddress: any;
            createdAt: any;
            updatedAt: any;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getOrderById(id: string): Promise<{
        _id: any;
        id: any;
        orderNumber: any;
        userId: {
            _id: any;
            id: any;
            name: any;
            email: any;
            phone: any;
        } | {
            _id: any;
            name: any;
            email: any;
            phone: any;
            id?: undefined;
        };
        products: any;
        subtotal: number;
        shippingCharge: number;
        tax: number;
        taxAmount: number;
        totalAmount: number;
        discountAmount: number;
        finalAmount: number;
        status: any;
        orderStatus: any;
        paymentStatus: any;
        paymentMethod: string;
        shippingAddress: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateOrderStatus(id: string, status: string): Promise<{
        _id: any;
        id: any;
        orderNumber: any;
        userId: {
            _id: any;
            id: any;
            name: any;
            email: any;
            phone: any;
        } | {
            _id: any;
            name: any;
            email: any;
            phone: any;
            id?: undefined;
        };
        products: any;
        subtotal: number;
        shippingCharge: number;
        tax: number;
        taxAmount: number;
        totalAmount: number;
        discountAmount: number;
        finalAmount: number;
        status: any;
        orderStatus: any;
        paymentStatus: any;
        paymentMethod: string;
        shippingAddress: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updatePaymentStatus(id: string, paymentStatus: string): Promise<{
        _id: any;
        id: any;
        orderNumber: any;
        userId: {
            _id: any;
            id: any;
            name: any;
            email: any;
            phone: any;
        } | {
            _id: any;
            name: any;
            email: any;
            phone: any;
            id?: undefined;
        };
        products: any;
        subtotal: number;
        shippingCharge: number;
        tax: number;
        taxAmount: number;
        totalAmount: number;
        discountAmount: number;
        finalAmount: number;
        status: any;
        orderStatus: any;
        paymentStatus: any;
        paymentMethod: string;
        shippingAddress: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteOrder(id: string): Promise<{
        success: boolean;
    }>;
    getRefunds(params?: any): Promise<{
        orders: {
            _id: any;
            id: any;
            orderNumber: any;
            userId: {
                _id: any;
                id: any;
                name: any;
                email: any;
                phone: any;
            } | {
                _id: any;
                name: any;
                email: any;
                phone: any;
                id?: undefined;
            };
            products: any;
            subtotal: number;
            shippingCharge: number;
            tax: number;
            taxAmount: number;
            totalAmount: number;
            discountAmount: number;
            finalAmount: number;
            status: any;
            orderStatus: any;
            paymentStatus: any;
            paymentMethod: string;
            shippingAddress: any;
            createdAt: any;
            updatedAt: any;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getUserOrders(userId: string): Promise<{
        _id: any;
        id: any;
        orderNumber: any;
        userId: {
            _id: any;
            id: any;
            name: any;
            email: any;
            phone: any;
        } | {
            _id: any;
            name: any;
            email: any;
            phone: any;
            id?: undefined;
        };
        products: any;
        subtotal: number;
        shippingCharge: number;
        tax: number;
        taxAmount: number;
        totalAmount: number;
        discountAmount: number;
        finalAmount: number;
        status: any;
        orderStatus: any;
        paymentStatus: any;
        paymentMethod: string;
        shippingAddress: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    getOrderByNumber(orderNumber: string): Promise<{
        _id: any;
        id: any;
        orderNumber: any;
        userId: {
            _id: any;
            id: any;
            name: any;
            email: any;
            phone: any;
        } | {
            _id: any;
            name: any;
            email: any;
            phone: any;
            id?: undefined;
        };
        products: any;
        subtotal: number;
        shippingCharge: number;
        tax: number;
        taxAmount: number;
        totalAmount: number;
        discountAmount: number;
        finalAmount: number;
        status: any;
        orderStatus: any;
        paymentStatus: any;
        paymentMethod: string;
        shippingAddress: any;
        createdAt: any;
        updatedAt: any;
    }>;
}
