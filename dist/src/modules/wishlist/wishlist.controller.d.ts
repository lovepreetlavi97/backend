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
