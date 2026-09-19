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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllReviews(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                include: {
                    user: { select: { id: true, name: true } },
                    product: { select: { id: true, title: true, slug: true, images: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.review.count(),
        ]);
        const mapped = reviews.map((r) => ({
            _id: r.id,
            id: r.id,
            rating: r.rating,
            comment: r.comment || '',
            reviewText: r.comment || '',
            user: {
                _id: r.user?.id || r.userId,
                id: r.user?.id || r.userId,
                name: r.user?.name || 'Verified Customer',
            },
            product: r.product
                ? {
                    _id: r.product.id,
                    id: r.product.id,
                    title: r.product.title,
                    slug: r.product.slug,
                    image: Array.isArray(r.product.images) ? r.product.images[0] || '' : '',
                }
                : null,
            createdAt: r.createdAt.toISOString(),
        }));
        return {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit) || 1,
            reviews: mapped,
        };
    }
    async getTopReviews() {
        return this.prisma.review.findMany({
            where: { rating: { gte: 4 } },
            include: {
                user: { select: { id: true, name: true } },
                product: { select: { id: true, title: true, slug: true, images: true } },
            },
            orderBy: [
                { rating: 'desc' },
                { createdAt: 'desc' },
            ],
            take: 20,
        });
    }
    async getProductReviews(productId) {
        return this.prisma.review.findMany({
            where: { productId },
            include: {
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async addReview(userId, productId, rating, comment) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product || product.isDeleted) {
            throw new common_1.NotFoundException('Product not found.');
        }
        return this.prisma.review.create({
            data: {
                userId,
                productId,
                rating,
                comment,
            },
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map