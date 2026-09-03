import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly redis: RedisService,
  ) {}

  async findAll(params?: { type?: string; status?: string; metalId?: string }) {
    const isPublic = params?.status !== 'all' && (!params?.status || params.status === 'active');
    const cacheKey = `cache:banners:${params?.type || 'all'}:${params?.metalId || 'all'}`;

    if (isPublic) {
      const cached = await this.redis.get<any>(cacheKey);
      if (cached) return cached;
    }

    const where: any = { isDeleted: false };
    if (params?.type) {
      where.type = params.type;
    }
    
    if (params?.status === 'all') {
      // Admin request - return all non-deleted banners
    } else if (params?.status) {
      where.status = params.status;
      if (params.status === 'active') {
        where.isActive = true;
      }
    } else {
      // Public website default - return ONLY active banners
      where.status = 'active';
      where.isActive = true;
    }

    const banners = await this.prisma.banner.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const allMetals = await this.prisma.metal.findMany({ where: { isActive: true } });

    const result = banners.map((banner) => {
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

    if (isPublic) {
      await this.redis.set(cacheKey, result, 300).catch(() => null);
    }

    return result;
  }

  private async invalidateBannerCache() {
    await this.redis.delPattern('cache:*').catch(() => null);
  }

  async findById(id: string) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!banner || banner.isDeleted) {
      throw new NotFoundException(`Banner with ID '${id}' not found.`);
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

  async createBanner(dto: any, file?: Express.Multer.File) {
    let imageUrl = '';
    let imageKey = '';

    if (file) {
      const result = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'banners',
      );
      imageUrl = result.key;
      imageKey = result.key;
    }

    let metalIdsArray: string[] = [];
    if (dto.metalIds) {
      if (Array.isArray(dto.metalIds)) {
        metalIdsArray = dto.metalIds;
      } else if (typeof dto.metalIds === 'string') {
        metalIdsArray = dto.metalIds.split(',').map((id: string) => id.trim()).filter(Boolean);
      } else {
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

    await this.invalidateBannerCache();
    return this.findById(banner.id);
  }

  async updateBanner(id: string, dto: any, file?: Express.Multer.File) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundException(`Banner with ID '${id}' not found.`);
    }

    let imageUrl = existing.imageUrl;
    let imageKey = existing.image;

    if (file) {
      const result = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'banners',
      );
      imageUrl = result.key;
      imageKey = result.key;
    }

    let metalIdsArray = existing.metalIds;
    if (dto.metalIds !== undefined) {
      if (Array.isArray(dto.metalIds)) {
        metalIdsArray = dto.metalIds;
      } else if (typeof dto.metalIds === 'string') {
        metalIdsArray = dto.metalIds.split(',').map((id: string) => id.trim()).filter(Boolean);
      } else {
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

    await this.invalidateBannerCache();
    return this.findById(id);
  }

  async deleteBanner(id: string) {
    await this.prisma.banner.update({
      where: { id },
      data: { isDeleted: true },
    });
    await this.invalidateBannerCache();
    return { success: true };
  }

  async toggleStatus(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner || banner.isDeleted) {
      throw new NotFoundException(`Banner with ID '${id}' not found.`);
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

    await this.invalidateBannerCache();
    return this.findById(id);
  }

  async updatePosition(id: string, direction: 'up' | 'down') {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');

    const currentPosition = banner.position;
    const newPosition = direction === 'up' ? Math.max(1, currentPosition - 1) : currentPosition + 1;

    await this.prisma.banner.update({
      where: { id },
      data: { position: newPosition },
    });

    await this.invalidateBannerCache();
    return { success: true };
  }
}
