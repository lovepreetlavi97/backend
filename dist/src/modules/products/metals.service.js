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
exports.MetalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MetalsService = class MetalsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapMetal(metal) {
        return {
            _id: metal.id,
            name: metal.name,
            slug: metal.slug,
            colorCode: metal.colorCode,
            gradient: metal.gradient,
            isActive: metal.isActive,
            type: metal.type,
            ratePerGram: Number(metal.ratePerGram),
            purity: metal.purity,
            createdAt: metal.updatedAt.toISOString(),
            updatedAt: metal.updatedAt.toISOString(),
        };
    }
    async getMetals() {
        const metals = await this.prisma.metal.findMany({
            orderBy: { updatedAt: 'desc' },
        });
        return metals.map((m) => this.mapMetal(m));
    }
    async getMetal(id) {
        const metal = await this.prisma.metal.findUnique({
            where: { id },
        });
        if (!metal) {
            throw new common_1.NotFoundException(`Metal with ID '${id}' not found.`);
        }
        return this.mapMetal(metal);
    }
    async createMetal(dto) {
        const metal = await this.prisma.metal.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                colorCode: dto.colorCode || '#c5a059',
                gradient: dto.gradient || 'linear-gradient(to right, #c5a059, #e0c283)',
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
        return this.mapMetal(metal);
    }
    async updateMetal(id, dto) {
        const metal = await this.prisma.metal.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.slug && { slug: dto.slug }),
                ...(dto.colorCode !== undefined && { colorCode: dto.colorCode }),
                ...(dto.gradient !== undefined && { gradient: dto.gradient }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
        return this.mapMetal(metal);
    }
    async deleteMetal(id) {
        await this.prisma.metal.delete({ where: { id } }).catch(() => null);
    }
};
exports.MetalsService = MetalsService;
exports.MetalsService = MetalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MetalsService);
//# sourceMappingURL=metals.service.js.map