import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    getAllCategories(pageStr?: string, limitStr?: string, search?: string): Promise<{
        status: string;
        data: {
            categories: {
                _id: string;
                metalIds: any[];
                metals: any[];
                productCount: number;
                isActive: boolean;
                subcategories: {
                    _id: string;
                    name: string;
                    description: string | null;
                    id: string;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                }[];
                products: {
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
                    id: string;
                }[];
                name: string;
                description: string | null;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                isFeatured: boolean;
                image: string | null;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    } | {
        status: string;
        data: {
            categories: {
                _id: string;
                metalIds: any[];
                metals: any[];
                productCount: number;
                isActive: boolean;
                subcategories: {
                    _id: string;
                    name: string;
                    description: string | null;
                    id: string;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                }[];
                products: {
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
                    id: string;
                }[];
                name: string;
                description: string | null;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                isFeatured: boolean;
                image: string | null;
            }[];
        };
    }>;
    getCategoryByIdOrSlug(identifier: string): Promise<{
        status: string;
        data: {
            category: {
                _id: string;
                metalIds: any[];
                isActive: boolean;
                subcategories: {
                    name: string;
                    description: string | null;
                    id: string;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                }[];
                products: {
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
                }[];
                name: string;
                description: string | null;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                isFeatured: boolean;
                image: string | null;
            };
        };
    }>;
    createCategory(file: Express.Multer.File, dto: any): Promise<{
        status: string;
        message: string;
        data: {
            category: {
                _id: string;
                metalIds: any[];
                isActive: boolean;
                name: string;
                description: string | null;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                isFeatured: boolean;
                image: string | null;
            };
        };
    }>;
    updateCategory(id: string, file: Express.Multer.File, dto: any): Promise<{
        status: string;
        message: string;
        data: {
            category: {
                _id: string;
                metalIds: any[];
                isActive: boolean;
                name: string;
                description: string | null;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                isFeatured: boolean;
                image: string | null;
            };
        };
    }>;
    deleteCategory(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
