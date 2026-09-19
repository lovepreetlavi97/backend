import { MetalsService } from './metals.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';
export declare class MetalsController {
    private readonly metalsService;
    constructor(metalsService: MetalsService);
    getMetals(status?: string): Promise<{
        status: string;
        data: {
            metals: {
                _id: any;
                name: any;
                slug: any;
                colorCode: any;
                gradient: any;
                isActive: any;
                type: any;
                ratePerGram: number;
                purity: any;
                linkedProductsCount: number;
                activeProductsCount: number;
                linkedBannersCount: number;
                isLinked: boolean;
                createdAt: any;
                updatedAt: any;
            }[];
        };
    }>;
    getMetal(id: string): Promise<{
        metal: {
            _id: any;
            name: any;
            slug: any;
            colorCode: any;
            gradient: any;
            isActive: any;
            type: any;
            ratePerGram: number;
            purity: any;
            linkedProductsCount: number;
            activeProductsCount: number;
            linkedBannersCount: number;
            isLinked: boolean;
            createdAt: any;
            updatedAt: any;
        };
    }>;
    createMetal(dto: CreateMetalDto): Promise<{
        metal: {
            _id: any;
            name: any;
            slug: any;
            colorCode: any;
            gradient: any;
            isActive: any;
            type: any;
            ratePerGram: number;
            purity: any;
            linkedProductsCount: number;
            activeProductsCount: number;
            linkedBannersCount: number;
            isLinked: boolean;
            createdAt: any;
            updatedAt: any;
        };
    }>;
    updateMetal(id: string, dto: UpdateMetalDto): Promise<{
        metal: {
            _id: any;
            name: any;
            slug: any;
            colorCode: any;
            gradient: any;
            isActive: any;
            type: any;
            ratePerGram: number;
            purity: any;
            linkedProductsCount: number;
            activeProductsCount: number;
            linkedBannersCount: number;
            isLinked: boolean;
            createdAt: any;
            updatedAt: any;
        };
    }>;
    deleteMetal(id: string): Promise<{
        status: string;
        message: string;
    }>;
    updatePosition(id: string, dto: {
        direction: 'up' | 'down';
    }): Promise<{
        status: string;
        message: string;
    }>;
}
