import { OnModuleInit } from '@nestjs/common';
export declare class MeilisearchService implements OnModuleInit {
    private meiliClient;
    private readonly indexName;
    constructor();
    onModuleInit(): Promise<void>;
    addOrUpdateProduct(product: any): Promise<void>;
    searchProducts(query: string, filters?: string): Promise<any>;
}
