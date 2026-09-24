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
                    name: string;
                    id: string;
                    email: string;
                    phone: string;
                };
                _count: {
                    products: number;
                    vendorOrders: number;
                };
            } & {
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
            })[];
        };
    }>;
    approveVendor(id: string): Promise<{
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
    rejectVendor(id: string, dto: RejectReasonDto): Promise<{
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
    suspendVendor(id: string): Promise<{
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
                    name: string;
                    description: string | null;
                    id: string;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    isFeatured: boolean;
                    image: string | null;
                    metalIds: string[];
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
                    gstPercentage: import("@prisma/client/runtime/library").Decimal;
                    makingChargeGram: import("@prisma/client/runtime/library").Decimal;
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
                hasLifetimeGuarantee: boolean;
                isGstApplicable: boolean;
                gstPercentage: import("@prisma/client/runtime/library").Decimal | null;
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
                hasLifetimeGuarantee: boolean;
                isGstApplicable: boolean;
                gstPercentage: import("@prisma/client/runtime/library").Decimal | null;
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
                hasLifetimeGuarantee: boolean;
                isGstApplicable: boolean;
                gstPercentage: import("@prisma/client/runtime/library").Decimal | null;
                isPriceFixed: boolean;
                actualPrice: import("@prisma/client/runtime/library").Decimal | null;
                discountedPrice: import("@prisma/client/runtime/library").Decimal | null;
            };
        };
    }>;
}
