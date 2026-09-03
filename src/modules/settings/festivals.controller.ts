import { Controller, Get, Post, Put, Delete, Body, Param, Patch, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilterConfigService } from './filter-config.service';
import { UploadsService } from '../uploads/uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin - Festivals/Occasions')
@Controller('festivals')
export class FestivalsController {
  constructor(
    private readonly filterConfigService: FilterConfigService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get festivals/occasions (defaults to active for public)' })
  async getAllFestivals(@Query('status') status?: string) {
    let festivals = await this.filterConfigService.getOccasionsList();
    if (status !== 'all') {
      festivals = festivals.filter((f: any) => f.isActive !== false && f.status !== 'inactive');
    }
    const mapped = festivals.map((f: any) => ({
      _id: f._id,
      id: f._id,
      name: f.name,
      description: f.description || '',
      slug: f.slug,
      image: f.image || f.mainImage || '',
      link: f.link || f.url || '',
      startDate: f.startDate || '',
      endDate: f.endDate || '',
      metalIds: f.metalIds || [],
      isActive: f.isActive !== undefined ? f.isActive : true,
    }));
    return {
      status: 'success',
      data: {
        festivals: mapped,
        pagination: { total: mapped.length, page: 1, limit: 100, pages: 1 },
      },
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Create new festival/occasion' })
  async createFestival(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: any,
  ) {
    const file = files && files.length > 0 ? files[0] : null;
    let imageKey = dto.image || dto.mainImage;
    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'festivals',
      );
      imageKey = uploadRes.key || uploadRes.url;
    }

    let metalIds = dto.metalIds;
    if (typeof metalIds === 'string') {
      try {
        metalIds = JSON.parse(metalIds);
      } catch {
        metalIds = [metalIds];
      }
    }

    const payload = {
      ...dto,
      metalIds: Array.isArray(metalIds) ? metalIds : [],
      isActive: dto.isActive === 'false' || dto.isActive === false ? false : true,
      image: imageKey,
    };

    const festival = await this.filterConfigService.addOccasion(payload);
    return { status: 'success', data: { festival } };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Update festival/occasion by ID' })
  async updateFestival(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: any,
  ) {
    const file = files && files.length > 0 ? files[0] : null;
    let imageKey = dto.image;
    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'festivals',
      );
      imageKey = uploadRes.key || uploadRes.url;
    }

    let metalIds = dto.metalIds;
    if (metalIds !== undefined) {
      if (typeof metalIds === 'string') {
        try {
          metalIds = JSON.parse(metalIds);
        } catch {
          metalIds = [metalIds];
        }
      }
    }

    const payload = {
      ...dto,
      ...(metalIds !== undefined ? { metalIds: Array.isArray(metalIds) ? metalIds : [] } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive === 'false' || dto.isActive === false ? false : true } : {}),
      ...(imageKey ? { image: imageKey } : {}),
    };

    const festival = await this.filterConfigService.updateOccasion(id, payload);
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
