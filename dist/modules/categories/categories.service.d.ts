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
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
