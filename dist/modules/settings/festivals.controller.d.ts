import { FilterConfigService } from './filter-config.service';
import { UploadsService } from '../uploads/uploads.service';
export declare class FestivalsController {
    private readonly filterConfigService;
    private readonly uploadsService;
    constructor(filterConfigService: FilterConfigService, uploadsService: UploadsService);
    getAllFestivals(status?: string, search?: string, page?: string, limit?: string): Promise<{
        status: string;
        data: {
            festivals: {
                _id: any;
                id: any;
                name: any;
                description: any;
                slug: any;
                image: any;
                mainImage: any;
                link: any;
                startDate: any;
                endDate: any;
                metalIds: any;
                isActive: boolean;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    createFestival(file: Express.Multer.File, dto: any): Promise<{
        status: string;
        data: {
            festival: {
                _id: string;
                name: any;
                description: any;
                slug: string;
                image: any;
                link: any;
                startDate: any;
                endDate: any;
                metalIds: any;
                isActive: boolean;
            };
        };
    }>;
    updateFestival(id: string, file: Express.Multer.File, dto: any): Promise<{
        status: string;
        data: {
            festival: import("./dto/filter-config.dto").OccasionDto;
        };
    }>;
    toggleFestivalStatus(id: string): Promise<{
        status: string;
        data: {
            festival: import("./dto/filter-config.dto").OccasionDto;
        };
    }>;
    deleteFestival(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
