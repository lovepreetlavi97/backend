import { FilterConfigService } from './filter-config.service';
export declare class RelationsController {
    private readonly filterConfigService;
    constructor(filterConfigService: FilterConfigService);
    getAllRelations(status?: string): Promise<{
        status: string;
        data: {
            relations: {
                _id: any;
                id: any;
                name: any;
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
    createRelation(dto: any): Promise<{
        status: string;
        data: {
            relation: {
                _id: string;
                name: any;
                slug: string;
                isActive: any;
            };
        };
    }>;
    updateRelation(id: string, dto: any): Promise<{
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
