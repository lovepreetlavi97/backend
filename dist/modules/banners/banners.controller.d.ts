import { BannersService } from './banners.service';
export declare class BannersController {
    private readonly bannersService;
    constructor(bannersService: BannersService);
    getActiveBanners(type?: string, status?: string, metalId?: string): Promise<{
        status: string;
        data: {
            banners: any;
        };
    }>;
    getAllBannersAdmin(type?: string): Promise<{
        status: string;
        data: {
            banners: any;
        };
    }>;
    getBannerById(id: string): Promise<{
        status: string;
        data: {
            banner: {
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
            };
        };
    }>;
    createBanner(file: Express.Multer.File, body: any): Promise<{
        status: string;
        message: string;
        data: {
            banner: {
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
            };
        };
    }>;
    updateBanner(id: string, file: Express.Multer.File, body: any): Promise<{
        status: string;
        message: string;
        data: {
            banner: {
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
            };
        };
    }>;
    deleteBanner(id: string): Promise<{
        status: string;
        message: string;
    }>;
    toggleStatus(id: string): Promise<{
        status: string;
        message: string;
        data: {
            banner: {
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
            };
        };
    }>;
    updatePosition(id: string, direction: 'up' | 'down'): Promise<{
        status: string;
        message: string;
    }>;
}
