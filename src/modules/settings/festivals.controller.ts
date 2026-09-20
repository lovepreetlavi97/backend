import { Controller, Get, Post, Put, Delete, Body, Param, Patch, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @ApiOperation({ summary: 'Get all festivals/occasions for admin (active and inactive)' })
  async getAllFestivals(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('metalId') metalId?: string,
  ) {
    let festivals = await this.filterConfigService.getOccasionsList();

    if (status === 'active') {
      festivals = festivals.filter((f: any) => f.isActive !== false && f.status !== 'inactive');
    } else if (status === 'inactive') {
      festivals = festivals.filter((f: any) => f.isActive === false || f.status === 'inactive');
    }

    if (metalId && metalId.trim() !== '' && metalId.toLowerCase() !== 'all') {
      const mid = metalId.trim();
      festivals = festivals.filter((f: any) => {
        if (!f.metalIds || !Array.isArray(f.metalIds) || f.metalIds.length === 0) return false;
        return f.metalIds.includes(mid);
      });
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      festivals = festivals.filter(
        (f: any) =>
          (f.name && f.name.toLowerCase().includes(q)) ||
          (f.description && f.description.toLowerCase().includes(q)),
      );
    }

    const total = festivals.length;
    const pageNum = page ? Math.max(parseInt(page, 10), 1) : 1;
    const limitNum = limit ? Math.max(parseInt(limit, 10), 1) : 100;
    const pages = Math.ceil(total / limitNum) || 1;

    const mapped = festivals.map((f: any) => ({
      _id: f._id,
      id: f._id,
      name: f.name,
      description: f.description || '',
      slug: f.slug,
      image: typeof f.image === 'string' ? f.image : typeof f.mainImage === 'string' ? f.mainImage : '',
      mainImage: typeof f.image === 'string' ? f.image : typeof f.mainImage === 'string' ? f.mainImage : '',
      link: f.link || f.url || '',
      startDate: f.startDate || '',
      endDate: f.endDate || '',
      metalIds: f.metalIds || [],
      isActive: f.isActive !== false && f.status !== 'inactive',
    }));

    return {
      status: 'success',
      data: {
        festivals: mapped,
        pagination: { total, page: pageNum, limit: limitNum, pages },
      },
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create new festival/occasion' })
  async createFestival(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
  ) {
    let imageKey = typeof dto.image === 'string' ? dto.image : typeof dto.mainImage === 'string' ? dto.mainImage : '';
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
    } else {
      metalIds = [];
    }

    const payload = {
      ...dto,
      metalIds: Array.isArray(metalIds) ? metalIds : [metalIds],
      isActive: dto.isActive === 'false' || dto.isActive === false ? false : true,
      image: typeof imageKey === 'string' ? imageKey : '',
    };

    const festival = await this.filterConfigService.addOccasion(payload);
    return { status: 'success', data: { festival } };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update festival/occasion by ID' })
  async updateFestival(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
  ) {
    let imageKey: string | undefined = undefined;
    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'festivals',
      );
      imageKey = uploadRes.key || uploadRes.url;
    } else if (typeof dto.image === 'string' && dto.image) {
      imageKey = dto.image;
    } else if (typeof dto.mainImage === 'string' && dto.mainImage) {
      imageKey = dto.mainImage;
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
      ...(metalIds !== undefined ? { metalIds: Array.isArray(metalIds) ? metalIds : [metalIds] } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive === 'false' || dto.isActive === false ? false : true } : {}),
      ...(imageKey !== undefined ? { image: imageKey } : {}),
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
