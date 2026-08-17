import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
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
  ) {}

  async findAll(params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page ? Number(params.page) : undefined;
    const limit = params?.limit ? Number(params.limit) : undefined;

    const where: any = { isDeleted: false };
    if (params?.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [categories, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          include: { subcategories: { where: { isDeleted: false } } },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.category.count({ where }),
      ]);

      const mapped = categories.map((cat) => ({
        ...cat,
        _id: cat.id,
        metalIds: [],
        isActive: true,
        subcategories: cat.subcategories.map((sub) => ({
          ...sub,
          _id: sub.id,
        })),
      }));

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
      include: { subcategories: { where: { isDeleted: false } } },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => ({
      ...cat,
      _id: cat.id,
      metalIds: [],
      isActive: true,
      subcategories: cat.subcategories.map((sub) => ({
        ...sub,
        _id: sub.id,
      })),
    }));
  }

  async findBySlugOrId(identifier: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
        isDeleted: false,
      },
      include: {
        subcategories: { where: { isDeleted: false } },
        products: { where: { isDeleted: false, isPublished: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category '${identifier}' not found.`);
    }

    return {
      ...category,
      _id: category.id,
      metalIds: [],
      isActive: true,
    };
  }

  async create(dto: any, file?: Express.Multer.File) {
    const rawName = typeof dto.name === 'string' ? dto.name.trim() : '';
    if (!rawName) {
      throw new ConflictException('Category name is required.');
    }

    const slug = slugify(rawName, { lower: true, strict: true }) || `cat-${Date.now()}`;

    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: rawName }, { slug }], isDeleted: false },
    });
    if (existing) {
      throw new ConflictException('Category with this name already exists.');
    }

    let imageUrl = typeof dto.image === 'string' ? dto.image : null;
    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'categories',
      );
      imageUrl = uploadRes.key;
    }

    const isFeatured = dto.isFeatured === true || dto.isFeatured === 'true';

    const category = await this.prisma.category.create({
      data: {
        name: rawName,
        slug,
        description: dto.description || null,
        image: imageUrl,
        isFeatured,
      },
    });

    return {
      ...category,
      _id: category.id,
      metalIds: [],
      isActive: true,
    };
  }

  async update(id: string, dto: any, file?: Express.Multer.File) {
    const existing = await this.prisma.category.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      throw new NotFoundException(`Category with ID '${id}' not found.`);
    }

    const dataToUpdate: any = {};

    if (dto.name) {
      const rawName = dto.name.trim();
      if (rawName && rawName !== existing.name) {
        const slug = slugify(rawName, { lower: true, strict: true }) || `cat-${Date.now()}`;
        const duplicate = await this.prisma.category.findFirst({
          where: { OR: [{ name: rawName }, { slug }], id: { not: id }, isDeleted: false },
        });
        if (duplicate) {
          throw new ConflictException('Category with this name already exists.');
        }
        dataToUpdate.name = rawName;
        dataToUpdate.slug = slug;
      }
    }

    if (dto.description !== undefined) {
      dataToUpdate.description = dto.description;
    }

    if (dto.isFeatured !== undefined) {
      dataToUpdate.isFeatured = dto.isFeatured === true || dto.isFeatured === 'true';
    }

    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'categories',
      );
      dataToUpdate.image = uploadRes.key;
    } else if (typeof dto.image === 'string') {
      dataToUpdate.image = dto.image;
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      ...updated,
      _id: updated.id,
      metalIds: [],
      isActive: true,
    };
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

    return { message: 'Category deleted successfully.' };
  }
}
