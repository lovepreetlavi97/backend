import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { RedisService } from '../../shared/redis/redis.service';
export interface CreateCategoryDto {
    name: string;
    description?: string;
    image?: string;
    isFeatured?: boolean | string;
}
export declare class CategoriesService {
    private readonly prisma;
    private readonly uploadsService;
    private readonly redis;
    constructor(prisma: PrismaService, uploadsService: UploadsService, redis: RedisService);
    findAll(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
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
    }[] | {
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
    }>;
    findBySlugOrId(identifier: string): Promise<{
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
    }>;
    private generateUniqueSlug;
    create(dto: any, file?: Express.Multer.File): Promise<{
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
    }>;
    update(id: string, dto: any, file?: Express.Multer.File): Promise<{
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
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
