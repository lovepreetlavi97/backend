import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilterConfigService } from './filter-config.service';
import { UploadsService } from '../uploads/uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin - Gifts')
@Controller('admin/gift')
export class GiftsController {
  constructor(
    private readonly filterConfigService: FilterConfigService,
    private readonly uploadsService: UploadsService,
  ) {}

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
      description: f.description || '',
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
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create new gift' })
  async createGift(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
  ) {
    let imageUrl = dto.image;
    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'gifts',
      );
      imageUrl = uploadRes.key || uploadRes.url;
    }
    const payload = {
      ...dto,
      ...(imageUrl ? { image: imageUrl } : {}),
      isActive: dto.isActive !== undefined ? (dto.isActive === true || dto.isActive === 'true') : true,
    };
    const gift = await this.filterConfigService.addOccasion(payload);
    return { status: 'success', data: gift };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update gift by ID' })
  async updateGift(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
  ) {
    let imageUrl = dto.image;
    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'gifts',
      );
      imageUrl = uploadRes.key || uploadRes.url;
    }
    const payload = {
      ...dto,
      ...(imageUrl ? { image: imageUrl } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive === true || dto.isActive === 'true' } : {}),
    };
    const gift = await this.filterConfigService.updateOccasion(id, payload);
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
