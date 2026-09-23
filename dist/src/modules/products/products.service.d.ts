import { PrismaService } from '../prisma/prisma.service';
export interface CalculatedProductPrice {
    metalRatePerGram: number;
    weightGrams: number;
    baseMetalPrice: number;
    makingChargeGram: number;
    totalMakingCharge: number;
    priceBeforeTax: number;
    gstAmount: number;
    discountAmount: number;
    finalPrice: number;
}
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    calculatePrice(weightGrams: number, ratePerGram: number, makingChargeGram: number, gstPercentage?: number, discountPercent?: number): CalculatedProductPrice;
    findBySlug(slug: string): Promise<{
        calculatedPrice: CalculatedProductPrice;
        reviews: {
            id: string;
            createdAt: Date;
            userId: string;
            productId: string;
            rating: number;
            comment: string | null;
        }[];
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
    }>;
    findAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: string;
        collectionId?: string;
    }): Promise<{
        status: string;
        data: {
            products: {
                _id: string;
                id: string;
                name: string;
                title: string;
                slug: string;
                sku: string;
                description: string;
                image: string;
                mainImage: string;
                images: string[];
                weight: number;
                stock: number;
                stockQuantity: number;
                isFeatured: boolean;
                isPublished: boolean;
                isDeleted: boolean;
                isBlocked: boolean;
                actualPrice: number;
                discountedPrice: number;
                categoryId: {
                    _id: string;
                    name: string;
                    slug: string;
                };
                subcategoryId: {
                    _id: string;
                    name: string;
                    slug: string;
                };
                collectionIds: {
                    _id: string;
                    name: string;
                    slug: string;
                }[];
                metalIds: {
                    _id: string;
                    name: string;
                    slug: string;
                }[];
                metalId: string;
                priceRuleId: string;
                calculatedPrice: CalculatedProductPrice;
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
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    findById(id: string): Promise<{
        _id: string;
        id: string;
        name: string;
        title: string;
        slug: string;
        sku: string;
        description: string;
        image: string;
        mainImage: string;
        images: string[];
        weight: number;
        stock: number;
        stockQuantity: number;
        isFeatured: boolean;
        isPublished: boolean;
        isDeleted: boolean;
        isBlocked: boolean;
        actualPrice: number;
        discountedPrice: number;
        categoryId: {
            _id: string;
            name: string;
            slug: string;
        };
        subcategoryId: {
            _id: string;
            name: string;
            slug: string;
        };
        collectionIds: {
            _id: string;
            name: string;
            slug: string;
        }[];
        metalIds: {
            _id: string;
            name: string;
            slug: string;
        }[];
        metalId: string;
        priceRuleId: string;
        calculatedPrice: CalculatedProductPrice;
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
    }>;
    create(dto: any): Promise<{
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
    }>;
    update(id: string, dto: any): Promise<{
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
    }>;
    delete(id: string): Promise<{
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
    }>;
    toggleBlock(id: string): Promise<{
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
    }>;
}
