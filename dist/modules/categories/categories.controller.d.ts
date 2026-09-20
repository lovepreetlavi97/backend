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
                    image: string | null;
                    description: string | null;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
                    categoryId: string;
                }[];
                products: {
                    id: string;
                    metal: {
                        id: string;
                        type: import(".prisma/client").$Enums.MetalType;
                        isActive: boolean;
                        updatedAt: Date;
                        name: string;
                        slug: string;
                        colorCode: string | null;
                        gradient: string | null;
                        ratePerGram: import("@prisma/client/runtime/library").Decimal;
                        purity: string;
                    };
                }[];
                id: string;
                image: string | null;
                description: string | null;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                metals: any[];
                productCount: number;
                isActive: boolean;
                subcategories: {
                    _id: string;
                    id: string;
                    image: string | null;
                    description: string | null;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
                    categoryId: string;
                }[];
                products: {
                    id: string;
                    metal: {
                        id: string;
                        type: import(".prisma/client").$Enums.MetalType;
                        isActive: boolean;
                        updatedAt: Date;
                        name: string;
                        slug: string;
                        colorCode: string | null;
                        gradient: string | null;
                        ratePerGram: import("@prisma/client/runtime/library").Decimal;
                        purity: string;
                    };
                }[];
                id: string;
                image: string | null;
                description: string | null;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                metals: any[];
                isActive: boolean;
                products: {
                    id: string;
                    metal: {
                        id: string;
                        type: import(".prisma/client").$Enums.MetalType;
                        isActive: boolean;
                        updatedAt: Date;
                        name: string;
                        slug: string;
                        colorCode: string | null;
                        gradient: string | null;
                        ratePerGram: import("@prisma/client/runtime/library").Decimal;
                        purity: string;
                    };
                }[];
                subcategories: {
                    id: string;
                    image: string | null;
                    description: string | null;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
                    categoryId: string;
                }[];
                id: string;
                image: string | null;
                description: string | null;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                metals: any[];
                isActive: boolean;
                products: {
                    id: string;
                    metal: {
                        id: string;
                        type: import(".prisma/client").$Enums.MetalType;
                        isActive: boolean;
                        updatedAt: Date;
                        name: string;
                        slug: string;
                        colorCode: string | null;
                        gradient: string | null;
                        ratePerGram: import("@prisma/client/runtime/library").Decimal;
                        purity: string;
                    };
                }[];
                subcategories: {
                    id: string;
                    image: string | null;
                    description: string | null;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
                    categoryId: string;
                }[];
                id: string;
                image: string | null;
                description: string | null;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                metals: any[];
                isActive: boolean;
                products: {
                    id: string;
                    metal: {
                        id: string;
                        type: import(".prisma/client").$Enums.MetalType;
                        isActive: boolean;
                        updatedAt: Date;
                        name: string;
                        slug: string;
                        colorCode: string | null;
                        gradient: string | null;
                        ratePerGram: import("@prisma/client/runtime/library").Decimal;
                        purity: string;
                    };
                }[];
                subcategories: {
                    id: string;
                    image: string | null;
                    description: string | null;
                    isDeleted: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
                    categoryId: string;
                }[];
                id: string;
                image: string | null;
                description: string | null;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
                isFeatured: boolean;
            };
        };
    }>;
    deleteCategory(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
