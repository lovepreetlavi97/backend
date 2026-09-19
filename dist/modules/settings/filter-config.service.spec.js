"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const common_1 = require("@nestjs/common");
const filter_config_service_1 = require("./filter-config.service");
(0, vitest_1.describe)('FilterConfigService', () => {
    let service;
    let prismaMock;
    let redisMock;
    const sampleConfig = {
        banner: {
            title: 'The Gift Store',
            description: 'Handcrafted luxury',
            imageUrl: '/banner.png',
        },
        occasions: [{ _id: 'occ1', name: 'Anniversary', slug: 'anniversary' }],
        priceFilters: [{ _id: 'p1', min: 0, max: 10000, label: 'Under ₹10,000' }],
        recipients: [{ _id: 'rec1', name: 'Wife', slug: 'wife' }],
    };
    (0, vitest_1.beforeEach)(() => {
        prismaMock = {
            setting: {
                findUnique: vitest_1.vi.fn().mockImplementation(async () => ({
                    key: 'gift_store_config',
                    value: sampleConfig,
                })),
                upsert: vitest_1.vi.fn().mockImplementation(async (args) => ({
                    key: 'gift_store_config',
                    value: args.update.value || args.create.value,
                })),
            },
        };
        redisMock = {
            get: vitest_1.vi.fn().mockImplementation(async () => null),
            set: vitest_1.vi.fn().mockImplementation(async () => 'OK'),
            del: vitest_1.vi.fn().mockImplementation(async () => 1),
        };
        service = new filter_config_service_1.FilterConfigService(prismaMock, redisMock);
    });
    (0, vitest_1.it)('should be defined', () => {
        (0, vitest_1.expect)(service).toBeDefined();
    });
    (0, vitest_1.describe)('getGiftStoreConfig', () => {
        (0, vitest_1.it)('1. Redis HIT: Should return cached data without querying PostgreSQL', async () => {
            redisMock.get.mockImplementation(async () => sampleConfig);
            const result = await service.getGiftStoreConfig();
            (0, vitest_1.expect)(result).toEqual(sampleConfig);
            (0, vitest_1.expect)(redisMock.get).toHaveBeenCalledWith('cache:gift_store_config:v1');
            (0, vitest_1.expect)(prismaMock.setting.findUnique).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('2. Redis MISS: Should fetch from PostgreSQL and populate Redis cache', async () => {
            redisMock.get.mockImplementation(async () => null);
            const result = await service.getGiftStoreConfig();
            (0, vitest_1.expect)(result).toEqual(sampleConfig);
            (0, vitest_1.expect)(prismaMock.setting.findUnique).toHaveBeenCalledWith({
                where: { key: 'gift_store_config' },
            });
            (0, vitest_1.expect)(redisMock.set).toHaveBeenCalledWith('cache:gift_store_config:v1', sampleConfig, 300);
        });
        (0, vitest_1.it)('3. Redis Error Fallback: Should transparently fall back to PostgreSQL if Redis throws', async () => {
            redisMock.get.mockImplementation(async () => {
                throw new Error('Redis connection refused');
            });
            const result = await service.getGiftStoreConfig();
            (0, vitest_1.expect)(result).toEqual(sampleConfig);
            (0, vitest_1.expect)(prismaMock.setting.findUnique).toHaveBeenCalled();
        });
        (0, vitest_1.it)('4. PostgreSQL Error Fallback: Should fallback to stale Redis cache if DB fails', async () => {
            let callCount = 0;
            redisMock.get.mockImplementation(async () => {
                callCount++;
                return callCount === 1 ? null : sampleConfig;
            });
            prismaMock.setting.findUnique.mockImplementation(async () => {
                throw new Error('PostgreSQL connection timeout');
            });
            const result = await service.getGiftStoreConfig();
            (0, vitest_1.expect)(result).toEqual(sampleConfig);
        });
        (0, vitest_1.it)('5. Thundering Herd Single-Flight: Should coalesce concurrent calls into 1 DB query', async () => {
            redisMock.get.mockImplementation(async () => null);
            prismaMock.setting.findUnique.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ value: sampleConfig }), 50)));
            const [res1, res2, res3] = await Promise.all([
                service.getGiftStoreConfig(),
                service.getGiftStoreConfig(),
                service.getGiftStoreConfig(),
            ]);
            (0, vitest_1.expect)(res1).toEqual(sampleConfig);
            (0, vitest_1.expect)(res2).toEqual(sampleConfig);
            (0, vitest_1.expect)(res3).toEqual(sampleConfig);
            (0, vitest_1.expect)(prismaMock.setting.findUnique).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('updateGiftStoreConfig & Validation', () => {
        (0, vitest_1.it)('6. Validation: Should throw BadRequestException if min >= max in price filter', () => {
            const invalidDto = {
                banner: sampleConfig.banner,
                occasions: sampleConfig.occasions,
                priceFilters: [{ _id: 'p1', min: 10000, max: 5000, label: 'Invalid' }],
                recipients: sampleConfig.recipients,
            };
            (0, vitest_1.expect)(() => service.validateConfig(invalidDto)).toThrow(common_1.BadRequestException);
        });
        (0, vitest_1.it)('7. Validation: Should throw BadRequestException if duplicate occasion slugs exist', () => {
            const invalidDto = {
                banner: sampleConfig.banner,
                occasions: [
                    { _id: 'o1', name: 'Occasion 1', slug: 'dup' },
                    { _id: 'o2', name: 'Occasion 2', slug: 'dup' },
                ],
                priceFilters: sampleConfig.priceFilters,
                recipients: sampleConfig.recipients,
            };
            (0, vitest_1.expect)(() => service.validateConfig(invalidDto)).toThrow(common_1.BadRequestException);
        });
        (0, vitest_1.it)('8. Admin Update & Invalidation: Should update PostgreSQL and purge/re-warm Redis cache', async () => {
            const validDto = sampleConfig;
            const updated = await service.updateGiftStoreConfig(validDto);
            (0, vitest_1.expect)(updated).toEqual(validDto);
            (0, vitest_1.expect)(prismaMock.setting.upsert).toHaveBeenCalled();
            (0, vitest_1.expect)(redisMock.del).toHaveBeenCalledWith('cache:gift_store_config:v1');
            (0, vitest_1.expect)(redisMock.set).toHaveBeenCalledWith('cache:gift_store_config:v1', validDto, 300);
        });
    });
});
//# sourceMappingURL=filter-config.service.spec.js.map