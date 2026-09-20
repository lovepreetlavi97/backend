import { WishlistService } from './wishlist.service';
import { ProductsService } from '../products/products.service';
export declare class WishlistController {
    private readonly wishlistService;
    private readonly productsService;
    constructor(wishlistService: WishlistService, productsService: ProductsService);
    getWebsiteWishlist(userId: string): Promise<{
        status: string;
        data: {
            wishlist: {
                products: {
                    _id: string;
                    name: string;
                    slug: string;
                    image: string;
                    price: number;
                    originalPrice: number;
                    discount: number;
                    stock: number;
                }[];
            };
        };
    }>;
    addWebsiteWishlist(userId: string, body: {
        productId: string;
    }): Promise<{
        status: string;
        data: {
            wishlist: {
                products: {
                    _id: string;
                    name: string;
                    slug: string;
                    image: string;
                    price: number;
                    originalPrice: number;
                    discount: number;
                    stock: number;
                }[];
            };
        };
    }>;
    removeWebsiteWishlist(userId: string, body: {
        productId: string;
    }): Promise<{
        status: string;
        data: {
            wishlist: {
                products: {
                    _id: string;
                    name: string;
                    slug: string;
                    image: string;
                    price: number;
                    originalPrice: number;
                    discount: number;
                    stock: number;
                }[];
            };
        };
    }>;
    syncWebsiteWishlist(userId: string, body: {
        products: string[];
    }): Promise<{
        status: string;
        data: {
            wishlist: {
                products: {
                    _id: string;
                    name: string;
                    slug: string;
                    image: string;
                    price: number;
                    originalPrice: number;
                    discount: number;
                    stock: number;
                }[];
            };
        };
    }>;
    getUserWishlist(userId: string, user: any): Promise<{
        status: string;
        data: {
            items: ({
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
                        makingChargeGram: import("@prisma/client/runtime/library").Decimal;
                        gstPercentage: import("@prisma/client/runtime/library").Decimal;
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
                    isPriceFixed: boolean;
                    actualPrice: import("@prisma/client/runtime/library").Decimal | null;
                    discountedPrice: import("@prisma/client/runtime/library").Decimal | null;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                productId: string;
            })[];
        };
    }>;
    toggleWishlist(authUserId: string, body: {
        userId?: string;
        productId: string;
    }): Promise<{
        added: boolean;
        message: string;
        item?: undefined;
        status: string;
    } | {
        added: boolean;
        message: string;
        item: {
            id: string;
            createdAt: Date;
            userId: string;
            productId: string;
        };
        status: string;
    }>;
}
