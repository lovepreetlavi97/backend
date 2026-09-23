import { PrismaService } from '../prisma/prisma.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';
export declare class MetalsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapMetal;
    getMetals(): Promise<{
        _id: any;
        name: any;
        slug: any;
        colorCode: any;
        gradient: any;
        isActive: any;
        type: any;
        ratePerGram: number;
        purity: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    getMetal(id: string): Promise<{
        _id: any;
        name: any;
        slug: any;
        colorCode: any;
        gradient: any;
        isActive: any;
        type: any;
        ratePerGram: number;
        purity: any;
        createdAt: any;
        updatedAt: any;
    }>;
    createMetal(dto: CreateMetalDto): Promise<{
        _id: any;
        name: any;
        slug: any;
        colorCode: any;
        gradient: any;
        isActive: any;
        type: any;
        ratePerGram: number;
        purity: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateMetal(id: string, dto: UpdateMetalDto): Promise<{
        _id: any;
        name: any;
        slug: any;
        colorCode: any;
        gradient: any;
        isActive: any;
        type: any;
        ratePerGram: number;
        purity: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteMetal(id: string): Promise<void>;
}
