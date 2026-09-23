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
exports.VendorProductService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let VendorProductService = class VendorProductService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateSlug(title) {
        const cleanTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        const randomBytes = crypto.randomBytes(2).toString('hex');
        return `${cleanTitle}-${randomBytes}`;
    }
    generateSku(title) {
        const cleanPrefix = title
            .substring(0, 3)
            .toUpperCase()
            .replace(/[^A-Z]/g, 'PRD');
        const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `MYG-${cleanPrefix}-${randomHex}`;
    }
    async createVendorProduct(vendorId, dto) {
        const slug = this.generateSlug(dto.title);
        const sku = this.generateSku(dto.title);
        const approvalStatus = dto.submitForApproval ? 'PENDING_APPROVAL' : 'DRAFT';
        const product = await this.prisma.product.create({
            data: {
                vendorId,
                title: dto.title,
                slug,
                sku,
                description: dto.description,
                images: dto.images || [],
                weightGrams: dto.weightGrams,
                stockQuantity: dto.stockQuantity,
                categoryId: dto.categoryId || undefined,
                subcategoryId: dto.subcategoryId || undefined,
                metalId: dto.metalId || undefined,
                priceRuleId: dto.priceRuleId || undefined,
                approvalStatus,
                isPublished: false,
                isDeleted: false,
            },
        });
        return product;
    }
    async getVendorProducts(vendorId, page = 1, limit = 20, approvalStatus) {
        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where: {
                    vendorId,
                    isDeleted: false,
                    approvalStatus: approvalStatus ? approvalStatus : undefined,
                },
                include: { category: true, subcategory: true, metal: true, priceRule: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.product.count({
                where: {
                    vendorId,
                    isDeleted: false,
                    approvalStatus: approvalStatus ? approvalStatus : undefined,
                },
            }),
        ]);
        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getVendorProductById(vendorId, productId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { category: true, subcategory: true, metal: true, priceRule: true },
        });
        if (!product || product.isDeleted) {
            throw new common_1.NotFoundException('Product not found.');
        }
        if (product.vendorId !== vendorId) {
            throw new common_1.ForbiddenException('Access denied: You do not own this product.');
        }
        return product;
    }
    async updateVendorProduct(vendorId, productId, dto) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product || product.isDeleted) {
            throw new common_1.NotFoundException('Product not found.');
        }
        if (product.vendorId !== vendorId) {
            throw new common_1.ForbiddenException('Access denied: You do not own this product.');
        }
        let approvalStatus = product.approvalStatus;
        if (dto.submitForApproval) {
            approvalStatus = 'PENDING_APPROVAL';
        }
        else if (product.approvalStatus === 'REJECTED') {
            approvalStatus = 'DRAFT';
        }
        return this.prisma.product.update({
            where: { id: productId },
            data: {
                title: dto.title || product.title,
                description: dto.description || product.description,
                images: dto.images !== undefined ? dto.images : product.images,
                weightGrams: dto.weightGrams !== undefined ? dto.weightGrams : product.weightGrams,
                stockQuantity: dto.stockQuantity !== undefined ? dto.stockQuantity : product.stockQuantity,
                categoryId: dto.categoryId || product.categoryId,
                subcategoryId: dto.subcategoryId || product.subcategoryId,
                metalId: dto.metalId || product.metalId,
                priceRuleId: dto.priceRuleId || product.priceRuleId,
                approvalStatus,
                isPublished: approvalStatus === 'APPROVED' ? product.isPublished : false,
            },
        });
    }
    async deleteVendorProduct(vendorId, productId) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product || product.isDeleted) {
            throw new common_1.NotFoundException('Product not found.');
        }
        if (product.vendorId !== vendorId) {
            throw new common_1.ForbiddenException('Access denied: You do not own this product.');
        }
        return this.prisma.product.update({
            where: { id: productId },
            data: { isDeleted: true, isPublished: false },
        });
    }
    async getPendingProducts() {
        return this.prisma.product.findMany({
            where: {
                approvalStatus: 'PENDING_APPROVAL',
                isDeleted: false,
            },
            include: {
                vendor: { select: { id: true, shopName: true, email: true } },
                category: true,
                subcategory: true,
                metal: true,
                priceRule: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async approveProduct(productId) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product || product.isDeleted) {
            throw new common_1.NotFoundException('Product not found.');
        }
        return this.prisma.product.update({
            where: { id: productId },
            data: {
                approvalStatus: 'APPROVED',
                isPublished: true,
                rejectionReason: null,
            },
        });
    }
    async rejectProduct(productId, reason) {
        if (!reason || reason.trim() === '') {
            throw new common_1.BadRequestException('Rejection reason is required.');
        }
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product || product.isDeleted) {
            throw new common_1.NotFoundException('Product not found.');
        }
        return this.prisma.product.update({
            where: { id: productId },
            data: {
                approvalStatus: 'REJECTED',
                isPublished: false,
                rejectionReason: reason,
            },
        });
    }
};
exports.VendorProductService = VendorProductService;
exports.VendorProductService = VendorProductService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VendorProductService);
//# sourceMappingURL=vendor-product.service.js.map