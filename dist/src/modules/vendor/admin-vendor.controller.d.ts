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
                    email: string;
                    name: string;
                    phone: string;
                };
                _count: {
                    products: number;
                    vendorOrders: number;
                };
            } & {
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
    rejectVendor(id: string, dto: RejectReasonDto): Promise<{
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
    suspendVendor(id: string): Promise<{
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
    getPendingProducts(): Promise<{
        status: string;
        data: {
            products: ({
                vendor: {
                    id: string;
                    email: string;
                    shopName: string;
                };
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
    rejectProduct(id: string, dto: RejectReasonDto): Promise<{
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
}
