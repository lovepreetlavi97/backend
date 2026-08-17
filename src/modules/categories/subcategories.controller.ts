import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import slugify from 'slugify';

@ApiTags('Admin - Subcategories Management')
@Controller('subcategories')
export class SubCategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subcategories' })
  async getAllSubcategories(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [subcategories, total] = await Promise.all([
      this.prisma.subCategory.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subCategory.count({ where }),
    ]);

    const mapped = subcategories.map(sub => ({
      _id: sub.id,
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      image: sub.image,
      description: sub.description,
      categoryId: sub.category ? { _id: sub.category.id, name: sub.category.name } : sub.categoryId,
      category: sub.category ? { _id: sub.category.id, name: sub.category.name } : null,
      isBlocked: false,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    }));

    return {
      status: true,
      message: 'Subcategories fetched successfully',
      data: {
        subcategories: mapped,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subcategory by ID' })
  async getSubcategoryById(@Param('id') id: string) {
    const sub = await this.prisma.subCategory.findFirst({
      where: { id, isDeleted: false },
      include: { category: true },
    });
    if (!sub) {
      throw new NotFoundException('Subcategory not found');
    }
    return {
      status: true,
      message: 'Subcategory fetched successfully',
      data: {
        subcategory: {
          _id: sub.id,
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          image: sub.image,
          description: sub.description,
          categoryId: sub.category ? { _id: sub.category.id, name: sub.category.name } : sub.categoryId,
          category: sub.category ? { _id: sub.category.id, name: sub.category.name } : null,
          isBlocked: false,
        },
      },
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Create new subcategory' })
  async createSubcategory(@Body() dto: any) {
    const categoryId = dto.categoryId || dto.category;
    const slug = slugify(dto.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).slice(2, 7);
    const sub = await this.prisma.subCategory.create({
      data: {
        name: dto.name,
        slug,
        image: dto.image || null,
        description: dto.description || null,
        categoryId,
      },
    });
    return {
      status: true,
      message: 'Subcategory created successfully',
      data: { subcategory: sub },
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Update subcategory by ID' })
  async updateSubcategory(@Param('id') id: string, @Body() dto: any) {
    const sub = await this.prisma.subCategory.findUnique({ where: { id } });
    if (!sub || sub.isDeleted) {
      throw new NotFoundException('Subcategory not found');
    }
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    else if (dto.category !== undefined) data.categoryId = dto.category;

    const updated = await this.prisma.subCategory.update({
      where: { id },
      data,
    });
    return {
      status: true,
      message: 'Subcategory updated successfully',
      data: { subcategory: updated },
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Delete subcategory by ID' })
  async deleteSubcategory(@Param('id') id: string) {
    const sub = await this.prisma.subCategory.findUnique({ where: { id } });
    if (!sub || sub.isDeleted) {
      throw new NotFoundException('Subcategory not found');
    }
    await this.prisma.subCategory.update({
      where: { id },
      data: { isDeleted: true },
    });
    return {
      status: true,
      message: 'Subcategory deleted successfully',
    };
  }
}
