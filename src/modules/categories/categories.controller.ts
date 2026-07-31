import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CategoriesService, CreateCategoryDto } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAllCategories() {
    const categories = await this.categoriesService.findAll();
    return {
      status: 'success',
      data: { categories },
    };
  }

  @Get(':slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlug(slug);
    return {
      status: 'success',
      data: { category },
    };
  }

  @Post()
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    return {
      status: 'success',
      message: 'Category created successfully.',
      data: { category },
    };
  }
}
