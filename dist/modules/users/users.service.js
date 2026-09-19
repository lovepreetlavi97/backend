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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapUser(u) {
        return {
            _id: u.id,
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            phoneNumber: u.phone || '',
            role: u.role,
            status: u.isActive ? 'active' : 'inactive',
            isActive: u.isActive,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString(),
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User profile not found.');
        }
        return this.mapUser(user);
    }
    async updateProfile(userId, data) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return this.mapUser(updated);
    }
    async findAllUsers(params) {
        const page = Math.max(1, Number(params?.page || 1));
        const limit = Math.max(1, Number(params?.limit || 10));
        const skip = (page - 1) * limit;
        const where = { isDeleted: false };
        if (params?.role && params.role !== 'all') {
            const normalizedRole = params.role.toUpperCase().replace(/\s+/g, '');
            if (['USER', 'ADMIN', 'SUPERADMIN', 'VENDOR'].includes(normalizedRole)) {
                where.role = normalizedRole;
            }
        }
        if (params?.status && params.status !== 'all') {
            if (params.status === 'active')
                where.isActive = true;
            else if (params.status === 'inactive')
                where.isActive = false;
        }
        if (params?.search && params.search.trim()) {
            const s = params.search.trim();
            where.OR = [
                { name: { contains: s, mode: 'insensitive' } },
                { email: { contains: s, mode: 'insensitive' } },
                { phone: { contains: s, mode: 'insensitive' } },
            ];
        }
        const orderByField = params?.sortBy || 'createdAt';
        const orderDirection = params?.sortOrder || 'desc';
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: [{ [orderByField]: orderDirection }, { id: 'desc' }],
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            users: users.map((u) => this.mapUser(u)),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit) || 1,
            },
        };
    }
    async createUser(dto) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])],
            },
        });
        if (existing) {
            throw new common_1.ConflictException('User with this email or phone already exists.');
        }
        const rawPassword = dto.password || 'GuruGold@123';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const roleNormalized = (dto.role || 'USER').toUpperCase().replace(/\s+/g, '');
        const role = ['USER', 'ADMIN', 'SUPERADMIN', 'VENDOR'].includes(roleNormalized) ? roleNormalized : 'USER';
        const isActive = dto.status !== 'inactive';
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone || null,
                password: hashedPassword,
                role,
                isActive,
            },
        });
        return this.mapUser(user);
    }
    async updateUser(id, dto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user || user.isDeleted) {
            throw new common_1.NotFoundException(`User with ID '${id}' not found.`);
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.email !== undefined)
            data.email = dto.email;
        if (dto.phone !== undefined)
            data.phone = dto.phone || null;
        if (dto.role !== undefined) {
            const roleNormalized = dto.role.toUpperCase().replace(/\s+/g, '');
            if (['USER', 'ADMIN', 'SUPERADMIN', 'VENDOR'].includes(roleNormalized)) {
                data.role = roleNormalized;
            }
        }
        if (dto.status !== undefined) {
            data.isActive = dto.status === 'active';
        }
        if (dto.password && dto.password.trim().length > 0) {
            data.password = await bcrypt.hash(dto.password, 10);
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data,
        });
        return this.mapUser(updated);
    }
    async deleteUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user || user.isDeleted) {
            throw new common_1.NotFoundException(`User with ID '${id}' not found.`);
        }
        await this.prisma.user.update({
            where: { id },
            data: { isDeleted: true, isActive: false },
        });
        return { success: true };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map