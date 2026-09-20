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
    }[] | {
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
    }>;
    findBySlugOrId(identifier: string): Promise<{
        _id: string;
        metalIds: any[];
        metals: any[];
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
    }>;
    private generateUniqueSlug;
    create(dto: any, file?: Express.Multer.File): Promise<{
        _id: string;
        metalIds: any[];
        metals: any[];
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
    }>;
    update(id: string, dto: any, file?: Express.Multer.File): Promise<{
        _id: string;
        metalIds: any[];
        metals: any[];
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
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
