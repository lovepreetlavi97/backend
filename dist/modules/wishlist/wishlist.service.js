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
exports.WishlistService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WishlistService = class WishlistService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserWishlist(userId) {
        return this.prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    include: { metal: true, priceRule: true },
                },
            },
        });
    }
    async toggleWishlist(userId, productId) {
        const existing = await this.prisma.wishlist.findUnique({
            where: { userId_productId: { userId, productId } },
        });
        if (existing) {
            await this.prisma.wishlist.delete({ where: { id: existing.id } });
            return { added: false, message: 'Removed from wishlist' };
        }
        try {
            const item = await this.prisma.wishlist.create({
                data: { userId, productId },
            });
            return { added: true, message: 'Added to wishlist', item };
        }
        catch {
            return { added: true, message: 'Already in wishlist' };
        }
    }
};
exports.WishlistService = WishlistService;
exports.WishlistService = WishlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WishlistService);
//# sourceMappingURL=wishlist.service.js.map