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
exports.CartController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cart_service_1 = require("./cart.service");
const products_service_1 = require("../products/products.service");
const optional_jwt_auth_guard_1 = require("../../common/guards/optional-jwt-auth.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let CartController = class CartController {
    constructor(cartService, productsService) {
        this.cartService = cartService;
        this.productsService = productsService;
    }
    extractCartIdentity(req, headerGuestId, bodyGuestId) {
        const userId = req.user?.id || null;
        const guestId = !userId ? (headerGuestId || bodyGuestId || 'guest_default_session') : null;
        return { userId, guestId };
    }
    async getWebsiteCart(req, headerGuestId) {
        const { userId, guestId } = this.extractCartIdentity(req, headerGuestId);
        const rawItems = await this.cartService.getCart(userId || undefined, guestId || undefined);
        const items = rawItems.map((item) => {
            const product = item.product;
            const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 7200;
            const priceBreakdown = this.productsService.calculatePrice(Number(product.weightGrams || 0), ratePerGram, product.isPriceFixed, product.actualPrice ? Number(product.actualPrice) : null, product.discountedPrice ? Number(product.discountedPrice) : null);
            return {
                id: item.id,
                productId: product.id,
                name: product.title,
                slug: product.slug,
                image: product.images[0] || '',
                price: priceBreakdown.finalPrice,
                originalPrice: priceBreakdown.priceBeforeTax,
                discount: priceBreakdown.discountAmount,
                quantity: item.quantity,
                stock: product.stockQuantity,
            };
        });
        return {
            status: 'success',
            data: {
                cart: { items },
            },
        };
    }
    async addWebsiteCart(req, headerGuestId, body) {
        const { userId, guestId } = this.extractCartIdentity(req, headerGuestId, body.guestId);
        await this.cartService.addToCart(userId, guestId, body.productId, body.quantity || 1);
        return this.getWebsiteCart(req, headerGuestId || body.guestId);
    }
    async removeWebsiteCart(req, headerGuestId, body) {
        const { userId, guestId } = this.extractCartIdentity(req, headerGuestId, body.guestId);
        const items = await this.cartService.getCart(userId || undefined, guestId || undefined);
        const item = items.find((i) => i.productId === body.productId || i.id === body.cartItemId);
        if (item) {
            await this.cartService.removeFromCart(item.id, userId || undefined, guestId || undefined);
        }
        return this.getWebsiteCart(req, headerGuestId || body.guestId);
    }
    async updateQuantityWebsiteCart(req, headerGuestId, body) {
        const { userId, guestId } = this.extractCartIdentity(req, headerGuestId, body.guestId);
        const items = await this.cartService.getCart(userId || undefined, guestId || undefined);
        const item = items.find((i) => i.productId === body.productId);
        if (item) {
            const newQuantity = body.action === 'inc' ? item.quantity + 1 : item.quantity - 1;
            if (newQuantity <= 0) {
                await this.cartService.removeFromCart(item.id, userId || undefined, guestId || undefined);
            }
            else {
                await this.cartService.prisma.cart.update({
                    where: { id: item.id },
                    data: { quantity: newQuantity },
                });
            }
        }
        return this.getWebsiteCart(req, headerGuestId || body.guestId);
    }
    async syncGuestCart(userId, headerGuestId, body) {
        const guestId = body.guestId || headerGuestId;
        if (guestId) {
            await this.cartService.syncGuestCartToUser(guestId, userId);
        }
        if (body.items && Array.isArray(body.items)) {
            for (const item of body.items) {
                await this.cartService.addToCart(userId, null, item.productId, item.quantity);
            }
        }
        return this.cartService.getUserCart(userId);
    }
    async checkStock(body) {
        const items = body.items || [];
        const productIds = items.map((i) => i.productId).filter(Boolean);
        const products = await this.cartService.prisma.product.findMany({
            where: { id: { in: productIds }, isDeleted: false },
            select: { id: true, stockQuantity: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p.stockQuantity]));
        const results = items.map((item) => {
            const stock = productMap.get(item.productId) ?? 0;
            return {
                productId: item.productId,
                inStock: stock >= (item.quantity || 1),
                availableQuantity: stock,
            };
        });
        return {
            status: 'success',
            data: { results },
        };
    }
    async getUserCart(userId, user) {
        if (user.id !== userId && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            throw new common_1.ForbiddenException('Access denied: You can only view your own cart.');
        }
        const items = await this.cartService.getUserCart(userId);
        return {
            status: 'success',
            data: { items },
        };
    }
};
exports.CartController = CartController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get cart items (Website Guest / User)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-guest-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getWebsiteCart", null);
__decorate([
    (0, common_1.Post)('add'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Add item to cart (Website Guest / User)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-guest-id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "addWebsiteCart", null);
__decorate([
    (0, common_1.Delete)('remove'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Remove item from cart (Website Guest / User)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-guest-id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "removeWebsiteCart", null);
__decorate([
    (0, common_1.Post)('update-quantity'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update cart item quantity (Website Guest / User)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-guest-id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "updateQuantityWebsiteCart", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Sync guest cart items to user account upon login' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Headers)('x-guest-id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "syncGuestCart", null);
__decorate([
    (0, common_1.Post)('check-stock'),
    (0, swagger_1.ApiOperation)({ summary: 'Check stock availability for cart items' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "checkStock", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user cart items (Mobile/Admin)' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getUserCart", null);
exports.CartController = CartController = __decorate([
    (0, swagger_1.ApiTags)('Cart'),
    (0, common_1.Controller)(['cart', 'user/cart']),
    __metadata("design:paramtypes", [cart_service_1.CartService,
        products_service_1.ProductsService])
], CartController);
//# sourceMappingURL=cart.controller.js.map