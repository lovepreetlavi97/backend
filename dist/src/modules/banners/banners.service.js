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
exports.BannersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
let BannersService = class BannersService {
    constructor(prisma, uploadsService) {
        this.prisma = prisma;
        this.uploadsService = uploadsService;
    }
    async findAll(params) {
        const where = { isDeleted: false };
        if (params?.type) {
            where.type = params.type;
        }
        if (params?.status) {
            where.status = params.status;
        }
        const banners = await this.prisma.banner.findMany({
            where,
            orderBy: { position: 'asc' },
        });
        const allMetals = await this.prisma.metal.findMany();
        return banners.map((banner) => {
            const matchedMetals = allMetals
                .filter((metal) => banner.metalIds.includes(metal.id))
                .map((metal) => ({
                _id: metal.id,
                name: metal.name,
                slug: metal.slug,
            }));
            return {
                _id: banner.id,
                title: banner.title,
                description: banner.description,
                type: banner.type,
                imageUrl: banner.imageUrl,
                image: banner.image,
                link: banner.link,
                startDate: banner.startDate,
                endDate: banner.endDate,
                status: banner.status,
                isActive: banner.isActive,
                buttonText: banner.buttonText,
                position: banner.position,
                isDeleted: banner.isDeleted,
                metalIds: matchedMetals,
                createdAt: banner.createdAt,
                updatedAt: banner.updatedAt,
            };
        });
    }
    async findById(id) {
        const banner = await this.prisma.banner.findUnique({
            where: { id },
        });
        if (!banner || banner.isDeleted) {
            throw new common_1.NotFoundException(`Banner with ID '${id}' not found.`);
        }
        const allMetals = await this.prisma.metal.findMany();
        const matchedMetals = allMetals
            .filter((metal) => banner.metalIds.includes(metal.id))
            .map((metal) => ({
            _id: metal.id,
            name: metal.name,
            slug: metal.slug,
        }));
        return {
            _id: banner.id,
            title: banner.title,
            description: banner.description,
            type: banner.type,
            imageUrl: banner.imageUrl,
            image: banner.image,
            link: banner.link,
            startDate: banner.startDate,
            endDate: banner.endDate,
            status: banner.status,
            isActive: banner.isActive,
            buttonText: banner.buttonText,
            position: banner.position,
            isDeleted: banner.isDeleted,
            metalIds: matchedMetals,
            createdAt: banner.createdAt,
            updatedAt: banner.updatedAt,
        };
    }
    async createBanner(dto, file) {
        let imageUrl = '';
        let imageKey = '';
        if (file) {
            const result = await this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, 'banners');
            imageUrl = result.key;
            imageKey = result.key;
        }
        let metalIdsArray = [];
        if (dto.metalIds) {
            if (Array.isArray(dto.metalIds)) {
                metalIdsArray = dto.metalIds;
            }
            else if (typeof dto.metalIds === 'string') {
                metalIdsArray = dto.metalIds.split(',').map((id) => id.trim()).filter(Boolean);
            }
            else {
                metalIdsArray = [dto.metalIds];
            }
        }
        const status = dto.status || 'active';
        const isActive = status === 'active';
        const banner = await this.prisma.banner.create({
            data: {
                title: dto.title,
                description: dto.description || '',
                type: dto.type || 'home',
                imageUrl: imageUrl,
                image: imageKey,
                link: dto.link || '',
                startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
                endDate: dto.endDate ? new Date(dto.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: status,
                isActive: isActive,
                buttonText: dto.buttonText || 'Shop Now',
                position: dto.position ? parseInt(dto.position, 10) : 1,
                metalIds: metalIdsArray,
            },
        });
        return this.findById(banner.id);
    }
    async updateBanner(id, dto, file) {
        const existing = await this.prisma.banner.findUnique({ where: { id } });
        if (!existing || existing.isDeleted) {
            throw new common_1.NotFoundException(`Banner with ID '${id}' not found.`);
        }
        let imageUrl = existing.imageUrl;
        let imageKey = existing.image;
        if (file) {
            const result = await this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, 'banners');
            imageUrl = result.key;
            imageKey = result.key;
        }
        let metalIdsArray = existing.metalIds;
        if (dto.metalIds !== undefined) {
            if (Array.isArray(dto.metalIds)) {
                metalIdsArray = dto.metalIds;
            }
            else if (typeof dto.metalIds === 'string') {
                metalIdsArray = dto.metalIds.split(',').map((id) => id.trim()).filter(Boolean);
            }
            else {
                metalIdsArray = [dto.metalIds];
            }
        }
        const status = dto.status || existing.status;
        const isActive = dto.status ? (status === 'active') : existing.isActive;
        await this.prisma.banner.update({
            where: { id },
            data: {
                ...(dto.title && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.type && { type: dto.type }),
                imageUrl: imageUrl,
                image: imageKey,
                ...(dto.link !== undefined && { link: dto.link }),
                ...(dto.startDate && { startDate: new Date(dto.startDate) }),
                ...(dto.endDate && { endDate: new Date(dto.endDate) }),
                status: status,
                isActive: isActive,
                ...(dto.buttonText !== undefined && { buttonText: dto.buttonText }),
                ...(dto.position !== undefined && { position: parseInt(dto.position, 10) }),
                metalIds: metalIdsArray,
            },
        });
        return this.findById(id);
    }
    async deleteBanner(id) {
        await this.prisma.banner.update({
            where: { id },
            data: { isDeleted: true },
        });
        return { success: true };
    }
    async toggleStatus(id) {
        const banner = await this.prisma.banner.findUnique({ where: { id } });
        if (!banner || banner.isDeleted) {
            throw new common_1.NotFoundException(`Banner with ID '${id}' not found.`);
        }
        const newStatus = banner.status === 'active' ? 'inactive' : 'active';
        const newIsActive = newStatus === 'active';
        await this.prisma.banner.update({
            where: { id },
            data: {
                status: newStatus,
                isActive: newIsActive,
            },
        });
        return this.findById(id);
    }
    async updatePosition(id, direction) {
        const banner = await this.prisma.banner.findUnique({ where: { id } });
        if (!banner)
            throw new common_1.NotFoundException('Banner not found');
        const currentPosition = banner.position;
        const newPosition = direction === 'up' ? Math.max(1, currentPosition - 1) : currentPosition + 1;
        await this.prisma.banner.update({
            where: { id },
            data: { position: newPosition },
        });
        return { success: true };
    }
};
exports.BannersService = BannersService;
exports.BannersService = BannersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], BannersService);
//# sourceMappingURL=banners.service.js.map