import { FilterConfigService } from './filter-config.service';
export declare class FestivalsController {
    private readonly filterConfigService;
    constructor(filterConfigService: FilterConfigService);
    getAllFestivals(): Promise<{
        status: string;
        data: {
            festivals: {
                _id: any;
                id: any;
                name: any;
                slug: any;
                image: any;
                isActive: any;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    createFestival(dto: any): Promise<{
        status: string;
        data: {
            festival: {
                _id: string;
                name: any;
                slug: string;
                image: any;
                isActive: any;
            };
        };
    }>;
    updateFestival(id: string, dto: any): Promise<{
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
