import { CartService } from './cart.service';
import { ProductsService } from '../products/products.service';
export declare class CartController {
    private readonly cartService;
    private readonly productsService;
    constructor(cartService: CartService, productsService: ProductsService);
    private extractCartIdentity;
    getWebsiteCart(req: any, headerGuestId?: string): Promise<{
        status: string;
        data: {
            cart: {
                items: {
                    id: string;
                    productId: string;
                    name: string;
                    slug: string;
                    image: string;
                    price: number;
                    originalPrice: number;
                    discount: number;
                    quantity: number;
                    stock: number;
                }[];
            };
        };
    }>;
    addWebsiteCart(req: any, headerGuestId: string, body: {
        productId: string;
        quantity?: number;
        guestId?: string;
    }): Promise<{
        status: string;
        data: {
            cart: {
                items: {
                    id: string;
                    productId: string;
                    name: string;
                    slug: string;
                    image: string;
                    price: number;
                    originalPrice: number;
                    discount: number;
                    quantity: number;
                    stock: number;
                }[];
            };
        };
    }>;
    removeWebsiteCart(req: any, headerGuestId: string, body: {
        productId?: string;
        cartItemId?: string;
        guestId?: string;
    }): Promise<{
        status: string;
        data: {
            cart: {
                items: {
                    id: string;
                    productId: string;
                    name: string;
                    slug: string;
                    image: string;
                    price: number;
                    originalPrice: number;
                    discount: number;
                    quantity: number;
                    stock: number;
                }[];
            };
        };
    }>;
    updateQuantityWebsiteCart(req: any, headerGuestId: string, body: {
        productId: string;
        action: 'inc' | 'dec';
        guestId?: string;
    }): Promise<{
        status: string;
        data: {
            cart: {
                items: {
                    id: string;
                    productId: string;
                    name: string;
                    slug: string;
                    image: string;
                    price: number;
                    originalPrice: number;
                    discount: number;
                    quantity: number;
                    stock: number;
                }[];
            };
        };
    }>;
    syncGuestCart(userId: string, headerGuestId: string, body: {
        guestId?: string;
        items?: {
            productId: string;
            quantity: number;
        }[];
    }): Promise<({
        product: {
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
        };
    } & {
        id: string;
        userId: string | null;
        createdAt: Date;
        guestId: string | null;
        productId: string;
        quantity: number;
    })[]>;
    checkStock(body: {
        items: {
            productId: string;
            quantity: number;
        }[];
    }): Promise<{
        status: string;
        data: {
            results: {
                productId: string;
                inStock: boolean;
                availableQuantity: number;
            }[];
        };
    }>;
    getUserCart(userId: string, user: any): Promise<{
        status: string;
        data: {
            items: ({
                product: {
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
                };
            } & {
                id: string;
                userId: string | null;
                createdAt: Date;
                guestId: string | null;
                productId: string;
                quantity: number;
            })[];
        };
    }>;
}
