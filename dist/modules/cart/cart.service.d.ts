import { PrismaService } from '../prisma/prisma.service';
export declare class CartService {
    readonly prisma: PrismaService;
    constructor(prisma: PrismaService);
    getCart(userId?: string, guestId?: string): Promise<({
        product: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        productId: string;
        quantity: number;
        guestId: string | null;
    })[]>;
    getUserCart(userId: string): Promise<({
        product: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        productId: string;
        quantity: number;
        guestId: string | null;
    })[]>;
    addToCart(userId: string | null, guestId: string | null, productId: string, quantity?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        productId: string;
        quantity: number;
        guestId: string | null;
    }>;
    removeFromCart(cartItemId: string, userId?: string, guestId?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        productId: string;
        quantity: number;
        guestId: string | null;
    }>;
    syncGuestCartToUser(guestId: string, userId: string): Promise<void>;
}
