import { FilterConfigService } from './filter-config.service';
export declare class GiftsController {
    private readonly filterConfigService;
    constructor(filterConfigService: FilterConfigService);
    getAllGifts(): Promise<{
        status: string;
        data: {
            _id: any;
            id: any;
            name: any;
            slug: any;
            image: any;
            isActive: any;
        }[];
    }>;
    createGift(dto: any): Promise<{
        status: string;
        data: {
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
    }>;
    updateGift(id: string, dto: any): Promise<{
        status: string;
        data: import("./dto/filter-config.dto").OccasionDto;
    }>;
    deleteGift(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
