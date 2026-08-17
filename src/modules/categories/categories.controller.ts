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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Categories Management')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories with optional pagination and search' })
  async getAllCategories(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const result = await this.categoriesService.findAll({ page, limit, search });

    if ('pagination' in result) {
      return {
        status: 'success',
        data: result,
      };
    }

    return {
      status: 'success',
      data: { categories: result },
    };
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get category by ID or Slug' })
  async getCategoryByIdOrSlug(@Param('identifier') identifier: string) {
    const category = await this.categoriesService.findBySlugOrId(identifier);
    return {
      status: 'success',
      data: { category },
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create new category with optional image upload' })
  async createCategory(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
  ) {
    const category = await this.categoriesService.create(dto, file);
    return {
      status: 'success',
      message: 'Category created successfully.',
      data: { category },
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update category by ID' })
  async updateCategory(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
  ) {
    const category = await this.categoriesService.update(id, dto, file);
    return {
      status: 'success',
      message: 'Category updated successfully.',
      data: { category },
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Delete category by ID' })
  async deleteCategory(@Param('id') id: string) {
    const result = await this.categoriesService.delete(id);
    return {
      status: 'success',
      message: result.message,
    };
  }
}
