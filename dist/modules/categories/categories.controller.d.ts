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
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    isDeleted: boolean;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                }[];
                products: {
                    id: string;
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
                }[];
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isDeleted: boolean;
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
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    isDeleted: boolean;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                }[];
                products: {
                    id: string;
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
                }[];
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isDeleted: boolean;
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
                metals: any[];
                isActive: boolean;
                products: {
                    id: string;
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
                }[];
                subcategories: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    isDeleted: boolean;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                }[];
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isDeleted: boolean;
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
                metals: any[];
                isActive: boolean;
                products: {
                    id: string;
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
                }[];
                subcategories: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    isDeleted: boolean;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                }[];
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isDeleted: boolean;
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
                metals: any[];
                isActive: boolean;
                products: {
                    id: string;
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
                }[];
                subcategories: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    isDeleted: boolean;
                    slug: string;
                    categoryId: string;
                    image: string | null;
                }[];
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isDeleted: boolean;
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
