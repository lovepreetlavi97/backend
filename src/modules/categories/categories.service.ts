import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  image?: string;
  isFeatured?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      include: { subcategories: { where: { isDeleted: false } } },
      orderBy: { name: 'asc' },
    });
    return categories.map((cat) => ({
      ...cat,
      _id: cat.id,
      subcategories: cat.subcategories.map((sub) => ({
        ...sub,
        _id: sub.id,
      })),
    }));
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        subcategories: { where: { isDeleted: false } },
        products: { where: { isDeleted: false, isPublished: true } },
      },
    });

    if (!category || category.isDeleted) {
      throw new NotFoundException(`Category slug '${slug}' not found.`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Category with this name already exists.');
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
        isFeatured: dto.isFeatured || false,
      },
    });
  }
}
