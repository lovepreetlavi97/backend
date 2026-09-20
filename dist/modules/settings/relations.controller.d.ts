import { FilterConfigService } from './filter-config.service';
import { UploadsService } from '../uploads/uploads.service';
export declare class RelationsController {
    private readonly filterConfigService;
    private readonly uploadsService;
    constructor(filterConfigService: FilterConfigService, uploadsService: UploadsService);
    getAllRelations(status?: string): Promise<{
        status: string;
        data: {
            relations: {
                _id: any;
                id: any;
                name: any;
                description: any;
                image: any;
                icon: any;
                slug: any;
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
    createRelation(file: Express.Multer.File, dto: any): Promise<{
        status: string;
        data: {
            relation: {
                _id: string;
                name: any;
                description: any;
                image: any;
                icon: any;
                slug: string;
                isActive: boolean;
            };
        };
    }>;
    updateRelation(id: string, file: Express.Multer.File, dto: any): Promise<{
        status: string;
        data: {
            relation: import("./dto/filter-config.dto").RecipientDto;
        };
    }>;
    toggleRelationStatus(id: string): Promise<{
        status: string;
        data: {
            relation: import("./dto/filter-config.dto").RecipientDto;
        };
    }>;
    deleteRelation(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
