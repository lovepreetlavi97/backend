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
        this.otpCache = new Map();
        const config = (0, env_config_1.getEnvConfig)();
        this.jwtSecret = config.jwtSecret;
    }
    normalizePhone(countryCode, phoneNumber, rawPhone) {
        let raw = (rawPhone || phoneNumber || '').trim();
        const code = (countryCode || '').trim();
        if (code && !raw.startsWith('+') && !raw.startsWith(code.replace('+', ''))) {
            raw = `${code}${raw}`;
        }
        if (!raw.startsWith('+')) {
            raw = `+${raw.replace(/^[^\d]+/, '')}`;
        }
        const digitsOnly = raw.replace(/[^\d]/g, '');
        return { fullPhone: raw, digitsOnly };
    }
    async requestPhoneOtp(dto) {
        const { fullPhone, digitsOnly } = this.normalizePhone(dto.countryCode, dto.phoneNumber, dto.phone);
        const otp = '1111';
        await this.redis.set(`otp:${digitsOnly}`, otp, 300).catch(() => null);
        if (fullPhone) {
            await this.redis.set(`otp:${fullPhone}`, otp, 300).catch(() => null);
        }
        this.otpCache.set(digitsOnly, otp);
        if (fullPhone)
            this.otpCache.set(fullPhone, otp);
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    ...(fullPhone ? [{ phone: fullPhone }] : []),
                    ...(digitsOnly ? [{ phone: digitsOnly }, { phone: { endsWith: digitsOnly.slice(-10) } }] : []),
                ],
            },
        });
        const isRegistered = !!existingUser;
        return {
            userRegistered: isRegistered,
        };
    }
    async resendPhoneOtp(dto) {
        return this.requestPhoneOtp(dto);
    }
    async verifyPhoneOtp(dto) {
        const { fullPhone, digitsOnly } = this.normalizePhone(dto.countryCode, dto.phoneNumber, dto.phone);
        const cachedRedis = (await this.redis.get(`otp:${digitsOnly}`).catch(() => null)) ||
            (fullPhone ? await this.redis.get(`otp:${fullPhone}`).catch(() => null) : null);
        const cachedMem = this.otpCache.get(digitsOnly) || (fullPhone ? this.otpCache.get(fullPhone) : null);
        const isValid = dto.otp === '1111' || dto.otp === cachedRedis || dto.otp === cachedMem;
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP.');
        }
        await this.redis.del(`otp:${digitsOnly}`).catch(() => null);
        if (fullPhone)
            await this.redis.del(`otp:${fullPhone}`).catch(() => null);
        this.otpCache.delete(digitsOnly);
        if (fullPhone)
            this.otpCache.delete(fullPhone);
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    ...(fullPhone ? [{ phone: fullPhone }] : []),
                    ...(digitsOnly ? [{ phone: digitsOnly }, { phone: { endsWith: digitsOnly.slice(-10) } }] : []),
                ],
            },
        });
        if (!user) {
            const defaultPassword = await bcrypt.hash(`otp_user_${Date.now()}`, 10);
            const phoneToSave = fullPhone || digitsOnly;
            const placeholderEmail = `user_${digitsOnly || Date.now()}@gurujewellers.in`;
            user = await this.prisma.user.create({
                data: {
                    name: `User ${digitsOnly.slice(-4) || 'Guest'}`,
                    email: placeholderEmail,
                    phone: phoneToSave,
                    password: defaultPassword,
                    role: 'USER',
                },
            });
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    async register(dto) {
        const { fullPhone, digitsOnly } = this.normalizePhone(dto.countryCode, dto.phoneNumber, dto.phone);
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.email },
                    ...(fullPhone ? [{ phone: fullPhone }] : []),
                    ...(digitsOnly ? [{ phone: digitsOnly }, { phone: { endsWith: digitsOnly.slice(-10) } }] : []),
                ],
            },
        });
        if (existingUser) {
            const updateData = {};
            if (dto.name && !existingUser.name)
                updateData.name = dto.name;
            if (fullPhone && !existingUser.phone)
                updateData.phone = fullPhone;
            const updated = Object.keys(updateData).length > 0
                ? await this.prisma.user.update({ where: { id: existingUser.id }, data: updateData })
                : existingUser;
            const tokens = await this.generateTokens(updated.id, updated.email, updated.role);
            const { password, ...userWithoutPassword } = updated;
            return { user: userWithoutPassword, token: tokens.accessToken, ...tokens };
        }
        const rawPassword = dto.password || `pass_${Date.now()}`;
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name || `User ${digitsOnly.slice(-4) || ''}`,
                email: dto.email,
                phone: fullPhone || (digitsOnly ? `+${digitsOnly}` : null),
                password: hashedPassword,
                role: 'USER',
            },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token: tokens.accessToken, ...tokens };
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
        return { user: userWithoutPassword, token: tokens.accessToken, ...tokens };
    }
    async googleLogin(code) {
        const placeholderEmail = `google_${Date.now()}@gurujewellers.in`;
        let user = await this.prisma.user.findFirst({ where: { email: placeholderEmail } });
        if (!user) {
            const defaultPassword = await bcrypt.hash(`google_${Date.now()}`, 10);
            user = await this.prisma.user.create({
                data: {
                    name: 'Google User',
                    email: placeholderEmail,
                    password: defaultPassword,
                    role: 'USER',
                },
            });
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token: tokens.accessToken, ...tokens };
    }
    async generateTokens(userId, email, role) {
        const accessToken = jwt.sign({ id: userId, email, role }, this.jwtSecret, { expiresIn: '7d' });
        const refreshToken = jwt.sign({ id: userId, email, role, type: 'refresh' }, this.jwtSecret, { expiresIn: '30d' });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const adminAccount = await this.prisma.admin.findUnique({ where: { id: userId } }).catch(() => null);
        const isActuallyAdminTable = !!adminAccount;
        await this.prisma.session.create({
            data: {
                userId: !isActuallyAdminTable ? userId : null,
                adminId: isActuallyAdminTable ? userId : null,
                refreshToken,
                expiresAt,
            },
        }).catch(() => null);
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