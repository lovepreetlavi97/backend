"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeilisearchService = void 0;
const common_1 = require("@nestjs/common");
const meiliModule = require('meilisearch');
const Meilisearch = meiliModule.Meilisearch || meiliModule.default?.Meilisearch || meiliModule;
let MeilisearchService = class MeilisearchService {
    constructor() {
        this.indexName = 'products';
        const host = process.env.MEILI_HOST || 'http://localhost:7700';
        const apiKey = process.env.MEILI_MASTER_KEY || 'myg_meili_master_key_2026';
        try {
            this.meiliClient = new Meilisearch({ host, apiKey });
        }
        catch (e) {
            console.warn('⚠️ Meilisearch client init warning:', e.message);
        }
    }
    async onModuleInit() {
        if (!this.meiliClient)
            return;
        try {
            const index = this.meiliClient.index(this.indexName);
            await index.updateSearchableAttributes(['title', 'description', 'sku', 'slug']);
            await index.updateFilterableAttributes(['categoryId', 'subcategoryId', 'isPublished']);
            console.log('🔍 Meilisearch product index configured successfully.');
        }
        catch (e) {
            console.warn('⚠️ Meilisearch initialization notice:', e.message);
        }
    }
    async addOrUpdateProduct(product) {
        if (!this.meiliClient)
            return;
        try {
            const index = this.meiliClient.index(this.indexName);
            await index.addDocuments([
                {
                    id: product.id,
                    title: product.title,
                    slug: product.slug,
                    sku: product.sku,
                    description: product.description,
                    categoryId: product.categoryId,
                    subcategoryId: product.subcategoryId,
                    isPublished: product.isPublished,
                },
            ]);
        }
        catch (e) { }
    }
    async searchProducts(query, filters) {
        if (!this.meiliClient)
            return { hits: [], query, limit: 20 };
        try {
            const index = this.meiliClient.index(this.indexName);
            return await index.search(query, {
                filter: filters,
                limit: 20,
            });
        }
        catch (e) {
            return { hits: [], query, limit: 20 };
        }
    }
};
exports.MeilisearchService = MeilisearchService;
exports.MeilisearchService = MeilisearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MeilisearchService);
//# sourceMappingURL=meilisearch.service.js.map