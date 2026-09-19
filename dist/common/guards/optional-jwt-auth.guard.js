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
exports.OptionalJwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../../modules/auth/auth.service");
const redis_service_1 = require("../../shared/redis/redis.service");
let OptionalJwtAuthGuard = class OptionalJwtAuthGuard {
    constructor(authService, redisService) {
        this.authService = authService;
        this.redisService = redisService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        else if (request.cookies && request.cookies.accessToken) {
            token = request.cookies.accessToken;
        }
        if (!token) {
            return true;
        }
        try {
            const isBlacklisted = await this.redisService.get(`blacklist_${token}`);
            if (!isBlacklisted) {
                const decoded = this.authService.verifyToken(token);
                request.user = decoded;
            }
        }
        catch (e) {
        }
        return true;
    }
};
exports.OptionalJwtAuthGuard = OptionalJwtAuthGuard;
exports.OptionalJwtAuthGuard = OptionalJwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        redis_service_1.RedisService])
], OptionalJwtAuthGuard);
//# sourceMappingURL=optional-jwt-auth.guard.js.map