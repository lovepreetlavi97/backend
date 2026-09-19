import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { RedisService } from '../../shared/redis/redis.service';
export declare class BannersService {
    private readonly prisma;
    private readonly uploadsService;
    private readonly redis;
    constructor(prisma: PrismaService, uploadsService: UploadsService, redis: RedisService);
    findAll(params?: {
        type?: string;
        status?: string;
        metalId?: string;
    }): Promise<any>;
    private invalidateBannerCache;
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
