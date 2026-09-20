import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getAllProducts(query: any): Promise<{
        status: string;
        data: {
            products: {
                _id: any;
                id: any;
                name: any;
                title: any;
                slug: any;
                sku: any;
                description: any;
                shortDescription: any;
                image: any;
                mainImage: any;
                images: any;
                tags: any;
                tag: any;
                weight: number;
                weightGrams: number;
                grossWeight: number;
                netGoldWeight: number;
                stoneWeight: number;
                purity: any;
                wastagePercent: number;
                bisHallmark: any;
                stock: any;
                stockQuantity: any;
                isFeatured: any;
                isPublished: any;
                isDeleted: any;
                isBlocked: boolean;
                isPriceFixed: any;
                actualPrice: number;
                discountedPrice: number;
                festivalIds: any;
                relationIds: any;
                collectionIds: any;
                attributes: any;
                sizes: any;
                specifications: any;
                categoryId: {
                    _id: any;
                    name: any;
                    slug: any;
                };
                subcategoryId: {
                    _id: any;
                    name: any;
                    slug: any;
                };
                metalIds: {
                    _id: any;
                    name: any;
                    slug: any;
                }[];
                metalId: any;
                priceRuleId: any;
                calculatedPrice: import("./products.service").CalculatedProductPrice;
                category: any;
                subcategory: any;
                metal: any;
                priceRule: any;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    createProduct(dto: CreateProductDto): Promise<{
        status: string;
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
                isPriceFixed: boolean;
                actualPrice: import("@prisma/client/runtime/library").Decimal | null;
                discountedPrice: import("@prisma/client/runtime/library").Decimal | null;
            };
        };
    }>;
    updateProduct(id: string, dto: any): Promise<{
        status: string;
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
                isPriceFixed: boolean;
                actualPrice: import("@prisma/client/runtime/library").Decimal | null;
                discountedPrice: import("@prisma/client/runtime/library").Decimal | null;
            };
        };
    }>;
    deleteProduct(id: string): Promise<{
        status: string;
        message: string;
    }>;
    toggleBlockStatus(id: string): Promise<{
        status: string;
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
                isPriceFixed: boolean;
                actualPrice: import("@prisma/client/runtime/library").Decimal | null;
                discountedPrice: import("@prisma/client/runtime/library").Decimal | null;
            };
        };
    }>;
    getProductByParam(param: string): Promise<{
        status: string;
        data: {
            product: any;
        };
    }>;
}
