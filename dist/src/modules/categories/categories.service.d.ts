import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
export interface CreateCategoryDto {
    name: string;
    description?: string;
    image?: string;
    isFeatured?: boolean | string;
}
export declare class CategoriesService {
    private readonly prisma;
    private readonly uploadsService;
    constructor(prisma: PrismaService, uploadsService: UploadsService);
    findAll(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
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
    }[] | {
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
    }>;
    findBySlugOrId(identifier: string): Promise<{
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
    }>;
    create(dto: any, file?: Express.Multer.File): Promise<{
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
    }>;
    update(id: string, dto: any, file?: Express.Multer.File): Promise<{
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
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
