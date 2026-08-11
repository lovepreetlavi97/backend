import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { FilterConfigService } from './filter-config.service';
import { UpdateGiftStoreConfigDto } from './dto/filter-config.dto';

describe('FilterConfigService', () => {
  let service: FilterConfigService;
  let prismaMock: any;
  let redisMock: any;

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

  beforeEach(() => {
    prismaMock = {
      setting: {
        findUnique: vi.fn().mockImplementation(async () => ({
          key: 'gift_store_config',
          value: sampleConfig,
        })),
        upsert: vi.fn().mockImplementation(async (args) => ({
          key: 'gift_store_config',
          value: args.update.value || args.create.value,
        })),
      },
    };

    redisMock = {
      get: vi.fn().mockImplementation(async () => null),
      set: vi.fn().mockImplementation(async () => 'OK'),
      del: vi.fn().mockImplementation(async () => 1),
    };

    service = new FilterConfigService(prismaMock, redisMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGiftStoreConfig', () => {
    it('1. Redis HIT: Should return cached data without querying PostgreSQL', async () => {
      redisMock.get.mockImplementation(async () => sampleConfig);

      const result = await service.getGiftStoreConfig();

      expect(result).toEqual(sampleConfig);
      expect(redisMock.get).toHaveBeenCalledWith('cache:gift_store_config:v1');
      expect(prismaMock.setting.findUnique).not.toHaveBeenCalled();
    });

    it('2. Redis MISS: Should fetch from PostgreSQL and populate Redis cache', async () => {
      redisMock.get.mockImplementation(async () => null);

      const result = await service.getGiftStoreConfig();

      expect(result).toEqual(sampleConfig);
      expect(prismaMock.setting.findUnique).toHaveBeenCalledWith({
        where: { key: 'gift_store_config' },
      });
      expect(redisMock.set).toHaveBeenCalledWith(
        'cache:gift_store_config:v1',
        sampleConfig,
        300,
      );
    });

    it('3. Redis Error Fallback: Should transparently fall back to PostgreSQL if Redis throws', async () => {
      redisMock.get.mockImplementation(async () => {
        throw new Error('Redis connection refused');
      });

      const result = await service.getGiftStoreConfig();

      expect(result).toEqual(sampleConfig);
      expect(prismaMock.setting.findUnique).toHaveBeenCalled();
    });

    it('4. PostgreSQL Error Fallback: Should fallback to stale Redis cache if DB fails', async () => {
      let callCount = 0;
      redisMock.get.mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? null : sampleConfig;
      });
      prismaMock.setting.findUnique.mockImplementation(async () => {
        throw new Error('PostgreSQL connection timeout');
      });

      const result = await service.getGiftStoreConfig();

      expect(result).toEqual(sampleConfig);
    });

    it('5. Thundering Herd Single-Flight: Should coalesce concurrent calls into 1 DB query', async () => {
      redisMock.get.mockImplementation(async () => null);
      prismaMock.setting.findUnique.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ value: sampleConfig }), 50)),
      );

      const [res1, res2, res3] = await Promise.all([
        service.getGiftStoreConfig(),
        service.getGiftStoreConfig(),
        service.getGiftStoreConfig(),
      ]);

      expect(res1).toEqual(sampleConfig);
      expect(res2).toEqual(sampleConfig);
      expect(res3).toEqual(sampleConfig);
      expect(prismaMock.setting.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateGiftStoreConfig & Validation', () => {
    it('6. Validation: Should throw BadRequestException if min >= max in price filter', () => {
      const invalidDto: UpdateGiftStoreConfigDto = {
        banner: sampleConfig.banner,
        occasions: sampleConfig.occasions,
        priceFilters: [{ _id: 'p1', min: 10000, max: 5000, label: 'Invalid' }],
        recipients: sampleConfig.recipients,
      };

      expect(() => service.validateConfig(invalidDto)).toThrow(BadRequestException);
    });

    it('7. Validation: Should throw BadRequestException if duplicate occasion slugs exist', () => {
      const invalidDto: UpdateGiftStoreConfigDto = {
        banner: sampleConfig.banner,
        occasions: [
          { _id: 'o1', name: 'Occasion 1', slug: 'dup' },
          { _id: 'o2', name: 'Occasion 2', slug: 'dup' },
        ],
        priceFilters: sampleConfig.priceFilters,
        recipients: sampleConfig.recipients,
      };

      expect(() => service.validateConfig(invalidDto)).toThrow(BadRequestException);
    });

    it('8. Admin Update & Invalidation: Should update PostgreSQL and purge/re-warm Redis cache', async () => {
      const validDto: UpdateGiftStoreConfigDto = sampleConfig;

      const updated = await service.updateGiftStoreConfig(validDto);

      expect(updated).toEqual(validDto);
      expect(prismaMock.setting.upsert).toHaveBeenCalled();
      expect(redisMock.del).toHaveBeenCalledWith('cache:gift_store_config:v1');
      expect(redisMock.set).toHaveBeenCalledWith('cache:gift_store_config:v1', validDto, 300);
    });
  });
});
