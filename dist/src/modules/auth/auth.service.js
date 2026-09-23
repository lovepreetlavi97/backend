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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../../shared/redis/redis.service");
const env_config_1 = require("../../config/env.config");
let AuthService = class AuthService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        const config = (0, env_config_1.getEnvConfig)();
        this.jwtSecret = config.jwtSecret;
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { phone: dto.phone || undefined }],
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email or phone already exists.');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
                role: 'USER',
            },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, ...tokens };
    }
    async login(dto) {
        let account = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!account) {
            account = await this.prisma.admin.findUnique({
                where: { email: dto.email },
            });
        }
        if (!account || account.isDeleted || !account.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials or account disabled.');
        }
        const isMatch = await bcrypt.compare(dto.password, account.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const tokens = await this.generateTokens(account.id, account.email, account.role);
        const { password, ...userWithoutPassword } = account;
        return { user: userWithoutPassword, ...tokens };
    }
    async generateTokens(userId, email, role) {
        const accessToken = jwt.sign({ id: userId, email, role }, this.jwtSecret, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: userId, email, role, type: 'refresh' }, this.jwtSecret, { expiresIn: '7d' });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
        await this.prisma.session.create({
            data: {
                userId: !isAdmin ? userId : null,
                adminId: isAdmin ? userId : null,
                refreshToken,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, this.jwtSecret);
            const session = await this.prisma.session.findUnique({ where: { refreshToken } });
            if (!session || new Date() > session.expiresAt) {
                throw new common_1.UnauthorizedException('Refresh token expired or revoked.');
            }
            let user = await this.prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user) {
                user = await this.prisma.admin.findUnique({ where: { id: decoded.id } });
            }
            if (!user || user.isDeleted || !user.isActive) {
                throw new common_1.UnauthorizedException('User account inactive.');
            }
            const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, this.jwtSecret, { expiresIn: '15m' });
            return { accessToken };
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid refresh token.');
        }
    }
    async logout(refreshToken, token) {
        if (refreshToken) {
            await this.prisma.session.deleteMany({ where: { refreshToken } }).catch(() => null);
        }
        if (token) {
            try {
                const decoded = jwt.decode(token);
                const now = Math.floor(Date.now() / 1000);
                const ttl = decoded && decoded.exp ? Math.max(decoded.exp - now, 0) : 900;
                if (ttl > 0) {
                    await this.redis.set(`blacklist_${token}`, 'true', ttl);
                }
            }
            catch {
                await this.redis.set(`blacklist_${token}`, 'true', 900);
            }
        }
        return { message: 'Logged out successfully.' };
    }
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid or expired token.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map