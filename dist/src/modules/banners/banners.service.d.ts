import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
export declare class BannersService {
    private readonly prisma;
    private readonly uploadsService;
    constructor(prisma: PrismaService, uploadsService: UploadsService);
    findAll(params?: {
        type?: string;
        status?: string;
    }): Promise<{
        _id: string;
        title: string;
        description: string;
        type: string;
        imageUrl: string;
        image: string;
        link: string;
        startDate: Date;
        endDate: Date;
        status: string;
        isActive: boolean;
        buttonText: string;
        position: number;
        isDeleted: boolean;
        metalIds: {
            _id: string;
            name: string;
            slug: string;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findById(id: string): Promise<{
        _id: string;
        title: string;
        description: string;
        type: string;
        imageUrl: string;
        image: string;
        link: string;
        startDate: Date;
        endDate: Date;
        status: string;
        isActive: boolean;
        buttonText: string;
        position: number;
        isDeleted: boolean;
        metalIds: {
            _id: string;
            name: string;
            slug: string;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    createBanner(dto: any, file?: Express.Multer.File): Promise<{
        _id: string;
        title: string;
        description: string;
        type: string;
        imageUrl: string;
        image: string;
        link: string;
        startDate: Date;
        endDate: Date;
        status: string;
        isActive: boolean;
        buttonText: string;
        position: number;
        isDeleted: boolean;
        metalIds: {
            _id: string;
            name: string;
            slug: string;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateBanner(id: string, dto: any, file?: Express.Multer.File): Promise<{
        _id: string;
        title: string;
        description: string;
        type: string;
        imageUrl: string;
        image: string;
        link: string;
        startDate: Date;
        endDate: Date;
        status: string;
        isActive: boolean;
        buttonText: string;
        position: number;
        isDeleted: boolean;
        metalIds: {
            _id: string;
            name: string;
            slug: string;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteBanner(id: string): Promise<{
        success: boolean;
    }>;
    toggleStatus(id: string): Promise<{
        _id: string;
        title: string;
        description: string;
        type: string;
        imageUrl: string;
        image: string;
        link: string;
        startDate: Date;
        endDate: Date;
        status: string;
        isActive: boolean;
        buttonText: string;
        position: number;
        isDeleted: boolean;
        metalIds: {
            _id: string;
            name: string;
            slug: string;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePosition(id: string, direction: 'up' | 'down'): Promise<{
        success: boolean;
    }>;
}
