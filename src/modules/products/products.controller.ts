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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin - Products Management')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get all products with filters' })
  async getAllProducts(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('collectionId') collectionId?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    return this.productsService.findAll({ page, limit, search, categoryId, collectionId });
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(NoFilesInterceptor())
  @ApiOperation({ summary: 'Admin: Create new product' })
  async createProduct(@Body() dto: CreateProductDto) {
    const product = await this.productsService.create(dto);
    return {
      status: 'success',
      data: { product },
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(NoFilesInterceptor())
  @ApiOperation({ summary: 'Admin: Update product by ID' })
  async updateProduct(@Param('id') id: string, @Body() dto: any) {
    const product = await this.productsService.update(id, dto);
    return {
      status: 'success',
      data: { product },
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Delete product by ID' })
  async deleteProduct(@Param('id') id: string) {
    await this.productsService.delete(id);
    return {
      status: 'success',
      message: 'Product deleted successfully',
    };
  }

  @Put(':id/toggle-block')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Toggle block/unblock status of a product' })
  async toggleBlockStatus(@Param('id') id: string) {
    const product = await this.productsService.toggleBlock(id);
    return {
      status: 'success',
      data: { product },
    };
  }

  @Get(':param')
  @ApiOperation({ summary: 'Public/Admin: Get single product by UUID or slug' })
  async getProductByParam(@Param('param') param: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(param);
    if (isUuid) {
      const product = await this.productsService.findById(param);
      return {
        status: 'success',
        data: { product },
      };
    } else {
      const product = await this.productsService.findBySlug(param);
      return {
        status: 'success',
        data: { product },
      };
    }
  }
}
