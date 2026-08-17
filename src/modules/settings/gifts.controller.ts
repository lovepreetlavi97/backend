import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilterConfigService } from './filter-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin - Gifts')
@Controller('admin/gift')
export class GiftsController {
  constructor(private readonly filterConfigService: FilterConfigService) {}

  @Get('all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get all gifts' })
  async getAllGifts() {
    const occasions = await this.filterConfigService.getOccasionsList();
    const mapped = occasions.map((f: any) => ({
      _id: f._id,
      id: f._id,
      name: f.name,
      slug: f.slug,
      image: f.image,
      isActive: f.isActive !== undefined ? f.isActive : true,
    }));
    return { status: 'success', data: mapped };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Create new gift' })
  async createGift(@Body() dto: any) {
    const gift = await this.filterConfigService.addOccasion(dto);
    return { status: 'success', data: gift };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Update gift by ID' })
  async updateGift(@Param('id') id: string, @Body() dto: any) {
    const gift = await this.filterConfigService.updateOccasion(id, dto);
    return { status: 'success', data: gift };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Delete gift by ID' })
  async deleteGift(@Param('id') id: string) {
    await this.filterConfigService.deleteOccasion(id);
    return { status: 'success', message: 'Gift deleted successfully' };
  }
}
