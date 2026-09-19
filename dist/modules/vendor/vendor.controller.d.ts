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
                phone: string | null;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                status: import(".prisma/client").$Enums.VendorStatus;
                rejectionReason: string | null;
                shopName: string;
                legalName: string | null;
                address: string | null;
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
                phone: string | null;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                status: import(".prisma/client").$Enums.VendorStatus;
                rejectionReason: string | null;
                shopName: string;
                legalName: string | null;
                address: string | null;
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
                phone: string | null;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                status: import(".prisma/client").$Enums.VendorStatus;
                rejectionReason: string | null;
                shopName: string;
                legalName: string | null;
                address: string | null;
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
                description: string;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                sku: string;
                title: string;
                images: string[];
                weightGrams: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: number;
                isFeatured: boolean;
                isPublished: boolean;
                vendorId: string | null;
                approvalStatus: import(".prisma/client").$Enums.ProductApprovalStatus;
                rejectionReason: string | null;
                categoryId: string | null;
                subcategoryId: string | null;
                metalId: string | null;
                priceRuleId: string | null;
                festivalIds: string[];
                relationIds: string[];
                collectionIds: string[];
                attributes: import("@prisma/client/runtime/library").JsonValue | null;
                specifications: import("@prisma/client/runtime/library").JsonValue | null;
                grossWeight: import("@prisma/client/runtime/library").Decimal | null;
                netGoldWeight: import("@prisma/client/runtime/library").Decimal | null;
                stoneWeight: import("@prisma/client/runtime/library").Decimal | null;
                purity: string | null;
                wastagePercent: import("@prisma/client/runtime/library").Decimal | null;
                bisHallmark: boolean;
                isPriceFixed: boolean;
                actualPrice: import("@prisma/client/runtime/library").Decimal | null;
                discountedPrice: import("@prisma/client/runtime/library").Decimal | null;
            };
        };
    }>;
    getProducts(req: any, pageStr?: string, limitStr?: string, status?: string): Promise<{
        status: string;
        data: {
            products: ({
                category: {
                    name: string;
                    description: string | null;
                    id: string;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    isFeatured: boolean;
                    image: string | null;
                };
                metal: {
                    type: import(".prisma/client").$Enums.MetalType;
                    name: string;
                    isActive: boolean;
                    id: string;
                    updatedAt: Date;
                    slug: string;
                    purity: string;
                    colorCode: string | null;
                    gradient: string | null;
                    ratePerGram: import("@prisma/client/runtime/library").Decimal;
                };
                priceRule: {
                    name: string;
                    id: string;
                    updatedAt: Date;
                    makingChargeGram: import("@prisma/client/runtime/library").Decimal;
                    gstPercentage: import("@prisma/client/runtime/library").Decimal;
                    discountPercent: import("@prisma/client/runtime/library").Decimal;
                };
                subcategory: {
                    name: string;
                    description: string | null;
                    id: string;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                };
            } & {
                description: string;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                sku: string;
                title: string;
                images: string[];
                weightGrams: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: number;
                isFeatured: boolean;
                isPublished: boolean;
                vendorId: string | null;
                approvalStatus: import(".prisma/client").$Enums.ProductApprovalStatus;
                rejectionReason: string | null;
                categoryId: string | null;
                subcategoryId: string | null;
                metalId: string | null;
                priceRuleId: string | null;
                festivalIds: string[];
                relationIds: string[];
                collectionIds: string[];
                attributes: import("@prisma/client/runtime/library").JsonValue | null;
                specifications: import("@prisma/client/runtime/library").JsonValue | null;
                grossWeight: import("@prisma/client/runtime/library").Decimal | null;
                netGoldWeight: import("@prisma/client/runtime/library").Decimal | null;
                stoneWeight: import("@prisma/client/runtime/library").Decimal | null;
                purity: string | null;
                wastagePercent: import("@prisma/client/runtime/library").Decimal | null;
                bisHallmark: boolean;
                isPriceFixed: boolean;
                actualPrice: import("@prisma/client/runtime/library").Decimal | null;
                discountedPrice: import("@prisma/client/runtime/library").Decimal | null;
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
                category: {
                    name: string;
                    description: string | null;
                    id: string;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    isFeatured: boolean;
                    image: string | null;
                };
                metal: {
                    type: import(".prisma/client").$Enums.MetalType;
                    name: string;
                    isActive: boolean;
                    id: string;
                    updatedAt: Date;
                    slug: string;
                    purity: string;
                    colorCode: string | null;
                    gradient: string | null;
                    ratePerGram: import("@prisma/client/runtime/library").Decimal;
                };
                priceRule: {
                    name: string;
                    id: string;
                    updatedAt: Date;
                    makingChargeGram: import("@prisma/client/runtime/library").Decimal;
                    gstPercentage: import("@prisma/client/runtime/library").Decimal;
                    discountPercent: import("@prisma/client/runtime/library").Decimal;
                };
                subcategory: {
                    name: string;
                    description: string | null;
                    id: string;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                };
            } & {
                description: string;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                sku: string;
                title: string;
                images: string[];
                weightGrams: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: number;
                isFeatured: boolean;
                isPublished: boolean;
                vendorId: string | null;
                approvalStatus: import(".prisma/client").$Enums.ProductApprovalStatus;
                rejectionReason: string | null;
                categoryId: string | null;
                subcategoryId: string | null;
                metalId: string | null;
                priceRuleId: string | null;
                festivalIds: string[];
                relationIds: string[];
                collectionIds: string[];
                attributes: import("@prisma/client/runtime/library").JsonValue | null;
                specifications: import("@prisma/client/runtime/library").JsonValue | null;
                grossWeight: import("@prisma/client/runtime/library").Decimal | null;
                netGoldWeight: import("@prisma/client/runtime/library").Decimal | null;
                stoneWeight: import("@prisma/client/runtime/library").Decimal | null;
                purity: string | null;
                wastagePercent: import("@prisma/client/runtime/library").Decimal | null;
                bisHallmark: boolean;
                isPriceFixed: boolean;
                actualPrice: import("@prisma/client/runtime/library").Decimal | null;
                discountedPrice: import("@prisma/client/runtime/library").Decimal | null;
            };
        };
    }>;
    updateProduct(req: any, id: string, dto: UpdateVendorProductDto): Promise<{
        status: string;
        message: string;
        data: {
            product: {
                description: string;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                sku: string;
                title: string;
                images: string[];
                weightGrams: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: number;
                isFeatured: boolean;
                isPublished: boolean;
                vendorId: string | null;
                approvalStatus: import(".prisma/client").$Enums.ProductApprovalStatus;
                rejectionReason: string | null;
                categoryId: string | null;
                subcategoryId: string | null;
                metalId: string | null;
                priceRuleId: string | null;
                festivalIds: string[];
                relationIds: string[];
                collectionIds: string[];
                attributes: import("@prisma/client/runtime/library").JsonValue | null;
                specifications: import("@prisma/client/runtime/library").JsonValue | null;
                grossWeight: import("@prisma/client/runtime/library").Decimal | null;
                netGoldWeight: import("@prisma/client/runtime/library").Decimal | null;
                stoneWeight: import("@prisma/client/runtime/library").Decimal | null;
                purity: string | null;
                wastagePercent: import("@prisma/client/runtime/library").Decimal | null;
                bisHallmark: boolean;
                isPriceFixed: boolean;
                actualPrice: import("@prisma/client/runtime/library").Decimal | null;
                discountedPrice: import("@prisma/client/runtime/library").Decimal | null;
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
