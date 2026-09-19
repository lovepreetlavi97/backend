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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const products_service_1 = require("./products.service");
const public_catalog_service_1 = require("./public-catalog.service");
const filter_config_service_1 = require("../settings/filter-config.service");
let PublicController = class PublicController {
    constructor(productsService, publicCatalogService, filterConfigService) {
        this.productsService = productsService;
        this.publicCatalogService = publicCatalogService;
        this.filterConfigService = filterConfigService;
    }
    async getHomepage() {
        return this.publicCatalogService.getHomepage();
    }
    async getCategoryMenu() {
        return this.publicCatalogService.getCategoryMenu();
    }
    async getCuratedCollectionsAdmin() {
        const collections = await this.publicCatalogService.getFeaturedSubcategories('/images/default-collection.jpg', 'Exclusive curated collection');
        const mapped = collections.map((c, index) => ({
            _id: c.id || c._id,
            id: c.id || c._id,
            name: c.name,
            slug: c.slug,
            image: c.image || '/images/default-collection.jpg',
            isActive: true,
            position: index + 1,
            createdAt: new Date().toISOString(),
        }));
        return {
            status: 'success',
            data: { curated: mapped, collections: mapped },
        };
    }
    async getCuratedCollectionsPublic() {
        const collections = await this.publicCatalogService.getFeaturedSubcategories('/images/default-collection.jpg', 'Exclusive curated collection');
        return {
            status: 'success',
            data: { collections, curated: collections },
        };
    }
    async getGiftFilters() {
        const config = await this.filterConfigService.getGiftStoreConfig();
        return {
            status: 'success',
            data: config,
        };
    }
    async getPriceFilters() {
        const priceFilters = await this.filterConfigService.getPriceFilters();
        return {
            status: 'success',
            data: { priceFilters },
        };
    }
    async getRelations() {
        const recipients = await this.filterConfigService.getRecipients();
        return {
            status: 'success',
            data: recipients,
        };
    }
    async getEssentials() {
        return this.publicCatalogService.getEssentials();
    }
    async getTrendingProducts(metalId, limit) {
        return this.publicCatalogService.getTrendingProducts(metalId, limit ? Number(limit) : 4);
    }
    async getCuratedCollections() {
        return this.publicCatalogService.getCuratedCollections();
    }
    async getFestivals(metalId) {
        return this.publicCatalogService.getFestivals(metalId);
    }
    async getHomeSearch(queryStr) {
        return this.publicCatalogService.getHomeSearch(queryStr);
    }
    async getUserCategories() {
        return this.publicCatalogService.getUserCategories();
    }
    async getProductBySlug(slug) {
        const product = await this.productsService.findBySlug(slug);
        return {
            status: 'success',
            data: { product },
        };
    }
    async getRelatedProducts(ids) {
        return this.publicCatalogService.getRelatedProducts(ids);
    }
    async getProductsByCategorySlug(slug, query) {
        return this.publicCatalogService.getProductsByCategorySlug(slug, query);
    }
    async getInstagramVideos(pageStr, limitStr) {
        return {
            status: 'success',
            data: {
                videos: [
                    {
                        _id: '1',
                        caption: 'Timeless Gold Crafts #GuruJewellers',
                        instagramLink: 'https://instagram.com/gurujewellers',
                        videoUrl: '/images/gifts/valentine.png',
                        thumbnail: '/images/gifts/valentine.png',
                    },
                    {
                        _id: '2',
                        caption: 'Handcrafted Heritage Royal Collection',
                        instagramLink: 'https://instagram.com/gurujewellers',
                        videoUrl: '/images/gifts/wedding.png',
                        thumbnail: '/images/gifts/wedding.png',
                    },
                    {
                        _id: '3',
                        caption: 'Bespoke Custom Jewellery Designs',
                        instagramLink: 'https://instagram.com/gurujewellers',
                        videoUrl: '/images/gifts/birthday.png',
                        thumbnail: '/images/gifts/birthday.png',
                    },
                ],
                pagination: {
                    page: pageStr ? parseInt(pageStr, 10) : 1,
                    limit: limitStr ? parseInt(limitStr, 10) : 6,
                    total: 3,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            },
        };
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)('homepage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get homepage banners and categories' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getHomepage", null);
__decorate([
    (0, common_1.Get)('categories/menu'),
    (0, swagger_1.ApiOperation)({ summary: 'Get category dropdown menu' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getCategoryMenu", null);
__decorate([
    (0, common_1.Get)('curated-collections'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin/Public: Get curated collections' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getCuratedCollectionsAdmin", null);
__decorate([
    (0, common_1.Get)('curated-collections/public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get curated collections' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getCuratedCollectionsPublic", null);
__decorate([
    (0, common_1.Get)('user/gift/filters'),
    (0, swagger_1.ApiOperation)({ summary: 'Get gift page filters' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getGiftFilters", null);
__decorate([
    (0, common_1.Get)('user/price-filters'),
    (0, swagger_1.ApiOperation)({ summary: 'Get price filters' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getPriceFilters", null);
__decorate([
    (0, common_1.Get)('user/relations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get gift recipients (relations)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getRelations", null);
__decorate([
    (0, common_1.Get)('user/products/essentials'),
    (0, swagger_1.ApiOperation)({ summary: 'Get shop essentials' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getEssentials", null);
__decorate([
    (0, common_1.Get)('user/trending-products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trending products' }),
    __param(0, (0, common_1.Query)('metalId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getTrendingProducts", null);
__decorate([
    (0, common_1.Get)('user/curated-collections'),
    (0, swagger_1.ApiOperation)({ summary: 'Get curated collections list' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getCuratedCollections", null);
__decorate([
    (0, common_1.Get)('user/festivals'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active festivals list' }),
    __param(0, (0, common_1.Query)('metalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getFestivals", null);
__decorate([
    (0, common_1.Get)('user/home-search'),
    (0, swagger_1.ApiOperation)({ summary: 'Get homepage search categories and products' }),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getHomeSearch", null);
__decorate([
    (0, common_1.Get)('user/categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of categories (user view)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getUserCategories", null);
__decorate([
    (0, common_1.Get)('user/product/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single product details by slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getProductBySlug", null);
__decorate([
    (0, common_1.Get)('user/related-products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get related products based on product IDs' }),
    __param(0, (0, common_1.Query)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getRelatedProducts", null);
__decorate([
    (0, common_1.Get)('user/products/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of products under a category or subcategory slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getProductsByCategorySlug", null);
__decorate([
    (0, common_1.Get)('instagram-videos'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Instagram reels/videos' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getInstagramVideos", null);
exports.PublicController = PublicController = __decorate([
    (0, swagger_1.ApiTags)('Client Public APIs'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        public_catalog_service_1.PublicCatalogService,
        filter_config_service_1.FilterConfigService])
], PublicController);
//# sourceMappingURL=public.controller.js.map