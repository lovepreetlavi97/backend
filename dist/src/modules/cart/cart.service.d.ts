import { PrismaService } from '../prisma/prisma.service';
export declare class CartService {
    readonly prisma: PrismaService;
    constructor(prisma: PrismaService);
    getCart(userId?: string, guestId?: string): Promise<({
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
        userId: string | null;
        productId: string;
        guestId: string | null;
        quantity: number;
    })[]>;
    getUserCart(userId: string): Promise<({
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
        userId: string | null;
        productId: string;
        guestId: string | null;
        quantity: number;
    })[]>;
    addToCart(userId: string | null, guestId: string | null, productId: string, quantity?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        productId: string;
        guestId: string | null;
        quantity: number;
    }>;
    removeFromCart(cartItemId: string, userId?: string, guestId?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        productId: string;
        guestId: string | null;
        quantity: number;
    }>;
    syncGuestCartToUser(guestId: string, userId: string): Promise<void>;
}
