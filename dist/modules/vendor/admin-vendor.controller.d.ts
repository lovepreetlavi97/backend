import { VendorService } from './vendor.service';
import { VendorProductService } from './vendor-product.service';
import { RejectReasonDto } from './dto/vendor.dto';
export declare class AdminVendorController {
    private readonly vendorService;
    private readonly vendorProductService;
    constructor(vendorService: VendorService, vendorProductService: VendorProductService);
    getVendors(status?: string): Promise<{
        status: string;
        data: {
            vendors: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    phone: string;
                };
                _count: {
                    vendorOrders: number;
                    products: number;
                };
            } & {
                id: string;
                userId: string;
                status: import(".prisma/client").$Enums.VendorStatus;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                phone: string | null;
                rejectionReason: string | null;
                shopName: string;
                legalName: string | null;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                gstin: string | null;
            })[];
        };
    }>;
    approveVendor(id: string): Promise<{
        status: string;
        message: string;
        data: {
            vendor: {
                id: string;
                userId: string;
                status: import(".prisma/client").$Enums.VendorStatus;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                phone: string | null;
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
    rejectVendor(id: string, dto: RejectReasonDto): Promise<{
        status: string;
        message: string;
        data: {
            vendor: {
                id: string;
                userId: string;
                status: import(".prisma/client").$Enums.VendorStatus;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                phone: string | null;
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
    suspendVendor(id: string): Promise<{
        status: string;
        message: string;
        data: {
            vendor: {
                id: string;
                userId: string;
                status: import(".prisma/client").$Enums.VendorStatus;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                phone: string | null;
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
    getPendingProducts(): Promise<{
        status: string;
        data: {
            products: ({
                vendor: {
                    id: string;
                    email: string;
                    shopName: string;
                };
                category: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    isDeleted: boolean;
                    slug: string;
                    isFeatured: boolean;
                    image: string | null;
                    metalIds: string[];
                };
                metal: {
                    id: string;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    type: import(".prisma/client").$Enums.MetalType;
                    slug: string;
                    purity: string;
                    colorCode: string | null;
                    gradient: string | null;
                    ratePerGram: import("@prisma/client/runtime/library").Decimal;
                };
                priceRule: {
                    id: string;
                    updatedAt: Date;
                    name: string;
                    makingChargeGram: import("@prisma/client/runtime/library").Decimal;
                    gstPercentage: import("@prisma/client/runtime/library").Decimal;
                    discountPercent: import("@prisma/client/runtime/library").Decimal;
                };
                subcategory: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    isDeleted: boolean;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                isDeleted: boolean;
                title: string;
                slug: string;
                sku: string;
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
        };
    }>;
    approveProduct(id: string): Promise<{
        status: string;
        message: string;
        data: {
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                isDeleted: boolean;
                title: string;
                slug: string;
                sku: string;
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
    rejectProduct(id: string, dto: RejectReasonDto): Promise<{
        status: string;
        message: string;
        data: {
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                isDeleted: boolean;
                title: string;
                slug: string;
                sku: string;
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
}
