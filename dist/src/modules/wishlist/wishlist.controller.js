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
exports.WishlistController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wishlist_service_1 = require("./wishlist.service");
const products_service_1 = require("../products/products.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let WishlistController = class WishlistController {
    constructor(wishlistService, productsService) {
        this.wishlistService = wishlistService;
        this.productsService = productsService;
    }
    async getWebsiteWishlist(userId) {
        const items = await this.wishlistService.getUserWishlist(userId);
        const products = items.map(item => {
            const product = item.product;
            const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
            const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
            const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
            const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;
            const priceBreakdown = this.productsService.calculatePrice(Number(product.weightGrams), ratePerGram, makingCharge, gstPercent, discountPercent);
            return {
                _id: product.id,
                name: product.title,
                slug: product.slug,
                image: product.images[0] || '',
                price: priceBreakdown.finalPrice,
                originalPrice: priceBreakdown.priceBeforeTax,
                discount: priceBreakdown.discountAmount,
                stock: product.stockQuantity,
            };
        });
        return {
            status: 'success',
            data: {
                wishlist: {
                    products
                }
            }
        };
    }
    async addWebsiteWishlist(userId, body) {
        const existing = await this.wishlistService.prisma.wishlist.findFirst({
            where: { userId, productId: body.productId }
        });
        if (!existing) {
            await this.wishlistService.prisma.wishlist.create({
                data: { userId, productId: body.productId }
            });
        }
        return this.getWebsiteWishlist(userId);
    }
    async removeWebsiteWishlist(userId, body) {
        const existing = await this.wishlistService.prisma.wishlist.findFirst({
            where: { userId, productId: body.productId }
        });
        if (existing) {
            await this.wishlistService.prisma.wishlist.delete({
                where: { id: existing.id }
            });
        }
        return this.getWebsiteWishlist(userId);
    }
    async syncWebsiteWishlist(userId, body) {
        if (body.products && Array.isArray(body.products)) {
            for (const prodId of body.products) {
                const existing = await this.wishlistService.prisma.wishlist.findFirst({
                    where: { userId, productId: prodId }
                });
                if (!existing) {
                    await this.wishlistService.prisma.wishlist.create({
                        data: { userId, productId: prodId }
                    });
                }
            }
        }
        return this.getWebsiteWishlist(userId);
    }
    async getUserWishlist(userId, user) {
        if (user.id !== userId && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            throw new common_1.ForbiddenException('Access denied: You can only view your own wishlist.');
        }
        const items = await this.wishlistService.getUserWishlist(userId);
        return {
            status: 'success',
            data: { items },
        };
    }
    async toggleWishlist(authUserId, body) {
        const userId = authUserId || body.userId;
        const result = await this.wishlistService.toggleWishlist(userId, body.productId);
        return {
            status: 'success',
            ...result,
        };
    }
};
exports.WishlistController = WishlistController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user wishlist items (Website)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WishlistController.prototype, "getWebsiteWishlist", null);
__decorate([
    (0, common_1.Post)('add'),
    (0, swagger_1.ApiOperation)({ summary: 'Add item to wishlist (Website)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WishlistController.prototype, "addWebsiteWishlist", null);
__decorate([
    (0, common_1.Delete)('remove'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove item from wishlist (Website)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WishlistController.prototype, "removeWebsiteWishlist", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync guest wishlist (Website)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WishlistController.prototype, "syncWebsiteWishlist", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user wishlist items (Mobile/Admin)' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WishlistController.prototype, "getUserWishlist", null);
__decorate([
    (0, common_1.Post)('toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Add or remove item from wishlist (Mobile/Admin)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WishlistController.prototype, "toggleWishlist", null);
exports.WishlistController = WishlistController = __decorate([
    (0, swagger_1.ApiTags)('Wishlist'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('wishlist'),
    __metadata("design:paramtypes", [wishlist_service_1.WishlistService,
        products_service_1.ProductsService])
], WishlistController);
//# sourceMappingURL=wishlist.controller.js.map