import { PrismaService } from '../prisma/prisma.service';
import { UpdateShipmentDto } from './dto/vendor.dto';
export declare class VendorOrderService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getVendorOrders(vendorId: string, page?: number, limit?: number, status?: string): Promise<{
        vendorOrders: ({
            order: {
                createdAt: Date;
                orderNumber: string;
                shippingAddress: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            vendorId: string;
            items: import("@prisma/client/runtime/library").JsonValue;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            orderStatus: import(".prisma/client").$Enums.VendorOrderStatus;
            vendorOrderNumber: string;
            trackingNumber: string | null;
            carrier: string | null;
            orderId: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getVendorOrderById(vendorId: string, vendorOrderId: string): Promise<{
        order: {
            createdAt: Date;
            orderNumber: string;
            shippingAddress: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        vendorId: string;
        items: import("@prisma/client/runtime/library").JsonValue;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderStatus: import(".prisma/client").$Enums.VendorOrderStatus;
        vendorOrderNumber: string;
        trackingNumber: string | null;
        carrier: string | null;
        orderId: string;
    }>;
    updateVendorOrderStatus(vendorId: string, vendorOrderId: string, status: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        vendorId: string;
        items: import("@prisma/client/runtime/library").JsonValue;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderStatus: import(".prisma/client").$Enums.VendorOrderStatus;
        vendorOrderNumber: string;
        trackingNumber: string | null;
        carrier: string | null;
        orderId: string;
    }>;
    updateTrackingInfo(vendorId: string, vendorOrderId: string, dto: UpdateShipmentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        vendorId: string;
        items: import("@prisma/client/runtime/library").JsonValue;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        orderStatus: import(".prisma/client").$Enums.VendorOrderStatus;
        vendorOrderNumber: string;
        trackingNumber: string | null;
        carrier: string | null;
        orderId: string;
    }>;
}
