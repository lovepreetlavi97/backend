import { PrismaService } from '../prisma/prisma.service';
export declare class SubCategoriesController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAllSubcategories(pageStr?: string, limitStr?: string, search?: string, categoryId?: string): Promise<{
        status: boolean;
        message: string;
        data: {
            subcategories: {
                _id: string;
                id: string;
                name: string;
                slug: string;
                image: string;
                description: string;
                categoryId: string | {
                    _id: string;
                    name: string;
                };
                category: {
                    _id: string;
                    name: string;
                };
                isBlocked: boolean;
                createdAt: string;
                updatedAt: string;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    getSubcategoryById(id: string): Promise<{
        status: boolean;
        message: string;
        data: {
            subcategory: {
                _id: string;
                id: string;
                name: string;
                slug: string;
                image: string;
                description: string;
                categoryId: string | {
                    _id: string;
                    name: string;
                };
                category: {
                    _id: string;
                    name: string;
                };
                isBlocked: boolean;
            };
        };
    }>;
    createSubcategory(dto: any): Promise<{
        status: boolean;
        message: string;
        data: {
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
        };
    }>;
    updateSubcategory(id: string, dto: any): Promise<{
        status: boolean;
        message: string;
        data: {
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
        };
    }>;
    deleteSubcategory(id: string): Promise<{
        status: boolean;
        message: string;
    }>;
}
