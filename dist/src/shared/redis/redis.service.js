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
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
const env_config_1 = require("../../config/env.config");
let RedisService = class RedisService {
    constructor() {
        this.defaultTtl = 3600;
        const config = (0, env_config_1.getEnvConfig)();
        this.client = (0, redis_1.createClient)({
            url: `redis://${config.redisHost}:${config.redisPort}`,
        });
    }
    async onModuleInit() {
        try {
            await this.client.connect();
            console.log('⚡ Connected to Redis Cache Server successfully.');
        }
        catch (err) {
            console.warn('⚠️ Redis connection warning:', err.message);
        }
    }
    async onModuleDestroy() {
        if (this.client.isOpen) {
            await this.client.disconnect();
        }
    }
    async get(key) {
        try {
            if (!this.client.isOpen)
                return null;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (e) {
            return null;
        }
    }
    async set(key, value, ttl = this.defaultTtl) {
        try {
            if (!this.client.isOpen)
                return false;
            await this.client.set(key, JSON.stringify(value), { EX: ttl });
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async del(key) {
        try {
            if (!this.client.isOpen)
                return false;
            await this.client.del(key);
            return true;
        }
        catch (e) {
            return false;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map