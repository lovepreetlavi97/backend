import { FilterConfigService } from './filter-config.service';
import { UploadsService } from '../uploads/uploads.service';
export declare class GiftsController {
    private readonly filterConfigService;
    private readonly uploadsService;
    constructor(filterConfigService: FilterConfigService, uploadsService: UploadsService);
    getAllGifts(): Promise<{
        status: string;
        data: {
            _id: any;
            id: any;
            name: any;
            description: any;
            slug: any;
            image: any;
            isActive: any;
        }[];
    }>;
    createGift(file: Express.Multer.File, dto: any): Promise<{
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
    updateGift(id: string, file: Express.Multer.File, dto: any): Promise<{
        status: string;
        data: import("./dto/filter-config.dto").OccasionDto;
    }>;
    deleteGift(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
