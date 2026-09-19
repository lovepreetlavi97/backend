import { OrdersService, CreateOrderDto } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(req: any, dto: CreateOrderDto): Promise<{
        status: string;
        message: string;
        data: {
            order: {
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
            };
        };
    }>;
    trackOrder(orderNumber: string): Promise<{
        status: string;
        data: {
            order: {
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
            };
        };
    }>;
    getRefundRequests(pageStr?: string, limitStr?: string, search?: string): Promise<{
        status: string;
        data: {
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
        };
    }>;
    getUserOrders(userId: string, user: any): Promise<{
        status: string;
        data: {
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
        };
    }>;
    getAllOrders(pageStr?: string, limitStr?: string, search?: string, status?: string, paymentStatus?: string, customerId?: string, startDate?: string, endDate?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
        status: string;
        data: {
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
        };
    }>;
    getOrderById(id: string): Promise<{
        status: string;
        data: {
            order: {
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
            };
        };
    }>;
    updateOrderStatus(id: string, dto: {
        status: string;
        notes?: string;
    }): Promise<{
        status: string;
        message: string;
        data: {
            order: {
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
            };
        };
    }>;
    updateOrderStatusDirect(id: string, dto: {
        status: string;
        notes?: string;
    }): Promise<{
        status: string;
        message: string;
        data: {
            order: {
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
            };
        };
    }>;
    updatePaymentStatus(id: string, dto: {
        paymentStatus: string;
        transactionId?: string;
    }): Promise<{
        status: string;
        message: string;
        data: {
            order: {
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
            };
        };
    }>;
    updateOrderProductStatus(orderId: string, productId: string, status: string): Promise<{
        status: string;
        message: string;
    }>;
    deleteOrder(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
