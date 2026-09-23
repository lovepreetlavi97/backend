import { VendorService } from './vendor.service';
import { VendorProductService } from './vendor-product.service';
import { VendorOrderService } from './vendor-order.service';
import { RegisterVendorDto, UpdateVendorProfileDto, CreateVendorProductDto, UpdateVendorProductDto, UpdateShipmentDto } from './dto/vendor.dto';
export declare class VendorController {
    private readonly vendorService;
    private readonly vendorProductService;
    private readonly vendorOrderService;
    constructor(vendorService: VendorService, vendorProductService: VendorProductService, vendorOrderService: VendorOrderService);
    registerVendor(userId: string, dto: RegisterVendorDto): Promise<{
        status: string;
        message: string;
        data: {
            vendor: {
                id: string;
                email: string | null;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                rejectionReason: string | null;
                status: import(".prisma/client").$Enums.VendorStatus;
                address: string | null;
                userId: string;
                shopName: string;
                legalName: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                gstin: string | null;
            };
        };
    }>;
    getStatus(userId: string): Promise<{
        status: string;
        data: {
            vendorId: string;
            shopName: string;
            status: import(".prisma/client").$Enums.VendorStatus;
            rejectionReason: string;
            createdAt: Date;
        };
    }>;
    getProfile(req: any): Promise<{
        status: string;
        data: {
            profile: {
                id: string;
                email: string | null;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                rejectionReason: string | null;
                status: import(".prisma/client").$Enums.VendorStatus;
                address: string | null;
                userId: string;
                shopName: string;
                legalName: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                gstin: string | null;
            };
        };
    }>;
    updateProfile(req: any, dto: UpdateVendorProfileDto): Promise<{
        status: string;
        message: string;
        data: {
            profile: {
                id: string;
                email: string | null;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                rejectionReason: string | null;
                status: import(".prisma/client").$Enums.VendorStatus;
                address: string | null;
                userId: string;
                shopName: string;
                legalName: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                gstin: string | null;
            };
        };
    }>;
    createProduct(req: any, dto: CreateVendorProductDto): Promise<{
        status: string;
        message: string;
        data: {
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isDeleted: boolean;
                slug: string;
                description: string;
                isFeatured: boolean;
                images: string[];
                categoryId: string | null;
                sku: string;
                title: string;
                weightGrams: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: number;
                isPublished: boolean;
                vendorId: string | null;
                approvalStatus: import(".prisma/client").$Enums.ProductApprovalStatus;
                rejectionReason: string | null;
                subcategoryId: string | null;
                metalId: string | null;
                priceRuleId: string | null;
            };
        };
    }>;
    getProducts(req: any, pageStr?: string, limitStr?: string, status?: string): Promise<{
        status: string;
        data: {
            products: ({
                metal: {
                    id: string;
                    name: string;
                    isActive: boolean;
                    updatedAt: Date;
                    slug: string;
                    colorCode: string | null;
                    gradient: string | null;
                    type: import(".prisma/client").$Enums.MetalType;
                    ratePerGram: import("@prisma/client/runtime/library").Decimal;
                    purity: string;
                };
                priceRule: {
                    id: string;
                    name: string;
                    updatedAt: Date;
                    makingChargeGram: import("@prisma/client/runtime/library").Decimal;
                    gstPercentage: import("@prisma/client/runtime/library").Decimal;
                    discountPercent: import("@prisma/client/runtime/library").Decimal;
                };
                category: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    isFeatured: boolean;
                };
                subcategory: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    categoryId: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isDeleted: boolean;
                slug: string;
                description: string;
                isFeatured: boolean;
                images: string[];
                categoryId: string | null;
                sku: string;
                title: string;
                weightGrams: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: number;
                isPublished: boolean;
                vendorId: string | null;
                approvalStatus: import(".prisma/client").$Enums.ProductApprovalStatus;
                rejectionReason: string | null;
                subcategoryId: string | null;
                metalId: string | null;
                priceRuleId: string | null;
            })[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getProductById(req: any, id: string): Promise<{
        status: string;
        data: {
            product: {
                metal: {
                    id: string;
                    name: string;
                    isActive: boolean;
                    updatedAt: Date;
                    slug: string;
                    colorCode: string | null;
                    gradient: string | null;
                    type: import(".prisma/client").$Enums.MetalType;
                    ratePerGram: import("@prisma/client/runtime/library").Decimal;
                    purity: string;
                };
                priceRule: {
                    id: string;
                    name: string;
                    updatedAt: Date;
                    makingChargeGram: import("@prisma/client/runtime/library").Decimal;
                    gstPercentage: import("@prisma/client/runtime/library").Decimal;
                    discountPercent: import("@prisma/client/runtime/library").Decimal;
                };
                category: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    isFeatured: boolean;
                };
                subcategory: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    categoryId: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isDeleted: boolean;
                slug: string;
                description: string;
                isFeatured: boolean;
                images: string[];
                categoryId: string | null;
                sku: string;
                title: string;
                weightGrams: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: number;
                isPublished: boolean;
                vendorId: string | null;
                approvalStatus: import(".prisma/client").$Enums.ProductApprovalStatus;
                rejectionReason: string | null;
                subcategoryId: string | null;
                metalId: string | null;
                priceRuleId: string | null;
            };
        };
    }>;
    updateProduct(req: any, id: string, dto: UpdateVendorProductDto): Promise<{
        status: string;
        message: string;
        data: {
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isDeleted: boolean;
                slug: string;
                description: string;
                isFeatured: boolean;
                images: string[];
                categoryId: string | null;
                sku: string;
                title: string;
                weightGrams: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: number;
                isPublished: boolean;
                vendorId: string | null;
                approvalStatus: import(".prisma/client").$Enums.ProductApprovalStatus;
                rejectionReason: string | null;
                subcategoryId: string | null;
                metalId: string | null;
                priceRuleId: string | null;
            };
        };
    }>;
    deleteProduct(req: any, id: string): Promise<{
        status: string;
        message: string;
    }>;
    getOrders(req: any, pageStr?: string, limitStr?: string, status?: string): Promise<{
        status: string;
        data: {
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
        };
    }>;
    getOrderById(req: any, id: string): Promise<{
        status: string;
        data: {
            order: {
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
            };
        };
    }>;
    updateOrderStatus(req: any, id: string, status: string): Promise<{
        status: string;
        message: string;
        data: {
            order: {
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
            };
        };
    }>;
    updateShipment(req: any, id: string, dto: UpdateShipmentDto): Promise<{
        status: string;
        message: string;
        data: {
            order: {
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
            };
        };
    }>;
}
