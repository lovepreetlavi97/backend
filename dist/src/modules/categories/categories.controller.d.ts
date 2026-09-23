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
                isActive: boolean;
                subcategories: {
                    _id: string;
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    categoryId: string;
                }[];
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isDeleted: boolean;
                slug: string;
                image: string | null;
                description: string | null;
                isFeatured: boolean;
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
                isActive: boolean;
                subcategories: {
                    _id: string;
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    categoryId: string;
                }[];
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isDeleted: boolean;
                slug: string;
                image: string | null;
                description: string | null;
                isFeatured: boolean;
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
                products: {
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
                }[];
                subcategories: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    categoryId: string;
                }[];
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
        };
    }>;
    deleteCategory(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
