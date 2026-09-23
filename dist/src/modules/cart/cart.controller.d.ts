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
    getUserCart(userId: string, user: any): Promise<{
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
                userId: string | null;
                productId: string;
                guestId: string | null;
                quantity: number;
            })[];
        };
    }>;
}
