import { PrismaService } from '../prisma/prisma.service';
export declare class WishlistService {
    readonly prisma: PrismaService;
    constructor(prisma: PrismaService);
    getUserWishlist(userId: string): Promise<({
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
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
    })[]>;
    toggleWishlist(userId: string, productId: string): Promise<{
        added: boolean;
        message: string;
        item?: undefined;
    } | {
        added: boolean;
        message: string;
        item: {
            id: string;
            createdAt: Date;
            userId: string;
            productId: string;
        };
    }>;
}
