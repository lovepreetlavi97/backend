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
exports.VendorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VendorService = class VendorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async registerVendor(userId, dto) {
        const existingVendor = await this.prisma.vendor.findUnique({
            where: { userId },
        });
        if (existingVendor) {
            throw new common_1.ConflictException('Vendor account already registered for this user.');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { role: 'VENDOR' },
        });
        const vendor = await this.prisma.vendor.create({
            data: {
                userId,
                shopName: dto.shopName,
                legalName: dto.legalName,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                pincode: dto.pincode,
                gstin: dto.gstin,
                status: 'PENDING',
            },
        });
        return vendor;
    }
    async getVendorStatus(userId) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { userId },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor application not found.');
        }
        return {
            vendorId: vendor.id,
            shopName: vendor.shopName,
            status: vendor.status,
            rejectionReason: vendor.rejectionReason,
            createdAt: vendor.createdAt,
        };
    }
    async getVendorProfile(vendorId) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { id: vendorId },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor profile not found.');
        }
        return vendor;
    }
    async updateVendorProfile(vendorId, dto) {
        const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor profile not found.');
        }
        return this.prisma.vendor.update({
            where: { id: vendorId },
            data: {
                shopName: dto.shopName || vendor.shopName,
                legalName: dto.legalName !== undefined ? dto.legalName : vendor.legalName,
                phone: dto.phone !== undefined ? dto.phone : vendor.phone,
                address: dto.address !== undefined ? dto.address : vendor.address,
                city: dto.city !== undefined ? dto.city : vendor.city,
                state: dto.state !== undefined ? dto.state : vendor.state,
                pincode: dto.pincode !== undefined ? dto.pincode : vendor.pincode,
                gstin: dto.gstin !== undefined ? dto.gstin : vendor.gstin,
                status: vendor.status === 'REJECTED' ? 'UNDER_REVIEW' : vendor.status,
            },
        });
    }
    async getAllVendors(status) {
        return this.prisma.vendor.findMany({
            where: status ? { status: status } : undefined,
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                _count: { select: { products: true, vendorOrders: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async approveVendor(vendorId) {
        const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found.');
        }
        return this.prisma.vendor.update({
            where: { id: vendorId },
            data: {
                status: 'APPROVED',
                rejectionReason: null,
            },
        });
    }
    async rejectVendor(vendorId, reason) {
        if (!reason || reason.trim() === '') {
            throw new common_1.BadRequestException('Rejection reason is required.');
        }
        const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found.');
        }
        return this.prisma.vendor.update({
            where: { id: vendorId },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
            },
        });
    }
    async suspendVendor(vendorId) {
        const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found.');
        }
        return this.prisma.vendor.update({
            where: { id: vendorId },
            data: { status: 'SUSPENDED' },
        });
    }
};
exports.VendorService = VendorService;
exports.VendorService = VendorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VendorService);
//# sourceMappingURL=vendor.service.js.map