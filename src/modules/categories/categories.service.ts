import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { RedisService } from '../../shared/redis/redis.service';
import { normalizeMediaKey } from '../../common/utils/storage.util';
import slugify from 'slugify';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  image?: string;
  isFeatured?: boolean | string;
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly redis: RedisService,
  ) {}

  async findAll(params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page ? Number(params.page) : undefined;
    const limit = params?.limit ? Number(params.limit) : undefined;

    const where: any = { isDeleted: false };
    if (params?.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const allActiveMetals = await this.prisma.metal.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
    });

    const getCategoryMetals = (cat: any) => {
      if (cat.metalIds && Array.isArray(cat.metalIds) && cat.metalIds.length > 0) {
        return allActiveMetals
          .filter((m) => cat.metalIds.includes(m.id))
          .map((m) => ({
            _id: m.id,
            id: m.id,
            name: m.name,
            slug: m.slug,
          }));
      }

      const metalMap = new Map<string, any>();
      (cat.products || []).forEach((p: any) => {
        if (p.metal) {
          metalMap.set(p.metal.id, {
            _id: p.metal.id,
            id: p.metal.id,
            name: p.metal.name,
            slug: p.metal.slug,
          });
        }
      });

      return Array.from(metalMap.values());
    };

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [categories, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          include: {
            subcategories: { where: { isDeleted: false } },
            products: { where: { isDeleted: false }, select: { id: true, metal: true } },
          },
          skip,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
        this.prisma.category.count({ where }),
      ]);

      const mapped = categories.map((cat) => {
        const categoryMetals = getCategoryMetals(cat);

        return {
          ...cat,
          _id: cat.id,
          metalIds: categoryMetals,
          metals: categoryMetals,
          productCount: cat.products.length,
          isActive: true,
          subcategories: cat.subcategories.map((sub) => ({
            ...sub,
            _id: sub.id,
          })),
        };
      });

      return {
        categories: mapped,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        subcategories: { where: { isDeleted: false } },
        products: { where: { isDeleted: false }, select: { id: true, metal: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return categories.map((cat) => {
      const categoryMetals = getCategoryMetals(cat);

      return {
        ...cat,
        _id: cat.id,
        metalIds: categoryMetals,
        metals: categoryMetals,
        productCount: cat.products.length,
        isActive: true,
        subcategories: cat.subcategories.map((sub) => ({
          ...sub,
          _id: sub.id,
        })),
      };
    });
  }

  async findBySlugOrId(identifier: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
        isDeleted: false,
      },
      include: {
        subcategories: { where: { isDeleted: false } },
        products: { where: { isDeleted: false, isPublished: true }, select: { id: true, metal: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category '${identifier}' not found.`);
    }

    const allActiveMetals = await this.prisma.metal.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
    });

    let categoryMetals: any[] = [];
    if (category.metalIds && Array.isArray(category.metalIds) && category.metalIds.length > 0) {
      categoryMetals = allActiveMetals
        .filter((m) => category.metalIds.includes(m.id))
        .map((m) => ({
          _id: m.id,
          id: m.id,
          name: m.name,
          slug: m.slug,
        }));
    } else {
      const metalMap = new Map<string, any>();
      (category.products || []).forEach((p: any) => {
        if (p.metal) {
          metalMap.set(p.metal.id, {
            _id: p.metal.id,
            id: p.metal.id,
            name: p.metal.name,
            slug: p.metal.slug,
          });
        }
      });
      categoryMetals = Array.from(metalMap.values());
    }

    return {
      ...category,
      _id: category.id,
      metalIds: categoryMetals,
      metals: categoryMetals,
      isActive: true,
    };
  }

  private async generateUniqueSlug(baseName: string, metalIds: string[] = [], excludeId?: string): Promise<string> {
    const baseSlug = slugify(baseName, { lower: true, strict: true }) || 'category';

    const existingBase = await this.prisma.category.findFirst({
      where: {
        slug: baseSlug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        isDeleted: false,
      },
    });

    if (!existingBase) {
      return baseSlug;
    }

    if (metalIds && metalIds.length > 0) {
      const metals = await this.prisma.metal.findMany({
        where: { id: { in: metalIds } },
        select: { slug: true, name: true },
      });
      for (const m of metals) {
        const metalSuffix = slugify(m.slug || m.name, { lower: true, strict: true });
        const candidate = `${baseSlug}-${metalSuffix}`;
        const existingCandidate = await this.prisma.category.findFirst({
          where: {
            slug: candidate,
            ...(excludeId ? { id: { not: excludeId } } : {}),
            isDeleted: false,
          },
        });
        if (!existingCandidate) {
          return candidate;
        }
      }
    }

    let counter = 1;
    while (true) {
      const candidate = `${baseSlug}-${counter}`;
      const exists = await this.prisma.category.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
          isDeleted: false,
        },
      });
      if (!exists) {
        return candidate;
      }
      counter++;
    }
  }

  async create(dto: any, file?: Express.Multer.File) {
    const rawName = typeof dto.name === 'string' ? dto.name.trim() : '';
    if (!rawName) {
      throw new ConflictException('Category name is required.');
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

    // Check for duplicates only if same name AND sharing the same metals
    const sameNameCategories = await this.prisma.category.findMany({
      where: {
        name: { equals: rawName, mode: 'insensitive' },
        isDeleted: false,
      },
    });

    const duplicate = sameNameCategories.find((cat) => {
      const catMetals = cat.metalIds || [];
      if (metalIdsArray.length === 0 && catMetals.length === 0) return true;
      return metalIdsArray.some((mId) => catMetals.includes(mId));
    });

    if (duplicate) {
      throw new ConflictException('A category with this name already exists for the selected metal(s).');
    }

    const slug = await this.generateUniqueSlug(rawName, metalIdsArray);

    let imageUrl = typeof dto.image === 'string' ? normalizeMediaKey(dto.image) : null;
    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'categories',
      );
      imageUrl = normalizeMediaKey(uploadRes.key);
    }

    const isFeatured = dto.isFeatured === true || dto.isFeatured === 'true';

    const category = await this.prisma.category.create({
      data: {
        name: rawName,
        slug,
        description: dto.description || null,
        image: imageUrl,
        isFeatured,
        metalIds: metalIdsArray,
      },
    });

    await this.redis.delPattern('cache:*').catch(() => null);

    return this.findBySlugOrId(category.id);
  }

  async update(id: string, dto: any, file?: Express.Multer.File) {
    const existing = await this.prisma.category.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      throw new NotFoundException(`Category with ID '${id}' not found.`);
    }

    const dataToUpdate: any = {};

    let metalIdsArray: string[] = existing.metalIds || [];
    if (dto.metalIds !== undefined) {
      if (Array.isArray(dto.metalIds)) {
        metalIdsArray = dto.metalIds;
      } else if (typeof dto.metalIds === 'string') {
        metalIdsArray = dto.metalIds.split(',').map((mId: string) => mId.trim()).filter(Boolean);
      } else {
        metalIdsArray = [dto.metalIds];
      }
      dataToUpdate.metalIds = metalIdsArray;
    }

    if (dto.name) {
      const rawName = dto.name.trim();
      if (rawName) {
        const sameNameCategories = await this.prisma.category.findMany({
          where: {
            name: { equals: rawName, mode: 'insensitive' },
            id: { not: id },
            isDeleted: false,
          },
        });

        const duplicate = sameNameCategories.find((cat) => {
          const catMetals = cat.metalIds || [];
          if (metalIdsArray.length === 0 && catMetals.length === 0) return true;
          return metalIdsArray.some((mId) => catMetals.includes(mId));
        });

        if (duplicate) {
          throw new ConflictException('A category with this name already exists for the selected metal(s).');
        }

        dataToUpdate.name = rawName;
        if (rawName !== existing.name) {
          dataToUpdate.slug = await this.generateUniqueSlug(rawName, metalIdsArray, id);
        }
      }
    }

    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'categories',
      );
      dataToUpdate.image = normalizeMediaKey(uploadRes.key);
    } else if (typeof dto.image === 'string') {
      dataToUpdate.image = normalizeMediaKey(dto.image);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dataToUpdate,
    });

    await this.redis.delPattern('cache:*').catch(() => null);

    return this.findBySlugOrId(updated.id);
  }

  async delete(id: string) {
    const existing = await this.prisma.category.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      throw new NotFoundException(`Category with ID '${id}' not found.`);
    }

    await this.prisma.category.update({
      where: { id },
      data: { isDeleted: true },
    });

    await this.redis.delPattern('cache:*').catch(() => null);

    return { message: 'Category deleted successfully.' };
  }
}
