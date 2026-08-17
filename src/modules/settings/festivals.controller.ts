import { Controller, Get, Post, Put, Delete, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilterConfigService } from './filter-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin - Festivals/Occasions')
@Controller('festivals')
export class FestivalsController {
  constructor(private readonly filterConfigService: FilterConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all festivals/occasions' })
  async getAllFestivals() {
    const festivals = await this.filterConfigService.getOccasionsList();
    const mapped = festivals.map((f: any) => ({
      _id: f._id,
      id: f._id,
      name: f.name,
      slug: f.slug,
      image: f.image,
      isActive: f.isActive !== undefined ? f.isActive : true,
    }));
    return {
      status: 'success',
      data: {
        festivals: mapped,
        pagination: { total: mapped.length, page: 1, limit: 100, pages: 1 }
      }
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Create new festival/occasion' })
  async createFestival(@Body() dto: any) {
    const festival = await this.filterConfigService.addOccasion(dto);
    return { status: 'success', data: { festival } };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Update festival/occasion by ID' })
  async updateFestival(@Param('id') id: string, @Body() dto: any) {
    const festival = await this.filterConfigService.updateOccasion(id, dto);
    return { status: 'success', data: { festival } };
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Toggle festival/occasion status' })
  async toggleFestivalStatus(@Param('id') id: string) {
    const list = await this.filterConfigService.getOccasionsList();
    const found = list.find((o: any) => o._id === id);
    const active = found ? (found as any).isActive : true;
    const festival = await this.filterConfigService.updateOccasion(id, { isActive: !active });
    return { status: 'success', data: { festival } };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Delete festival/occasion by ID' })
  async deleteFestival(@Param('id') id: string) {
    await this.filterConfigService.deleteOccasion(id);
    return { status: 'success', message: 'Festival deleted successfully' };
  }
}
