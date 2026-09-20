import { Controller, Get, Post, Put, Delete, Body, Param, Patch, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilterConfigService } from './filter-config.service';
import { UploadsService } from '../uploads/uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin - Relations/Recipients')
@Controller('relations')
export class RelationsController {
  constructor(
    private readonly filterConfigService: FilterConfigService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get relations/recipients (defaults to active for public)' })
  async getAllRelations(@Query('status') status?: string) {
    let relations = await this.filterConfigService.getRecipientsList();
    if (status !== 'all') {
      relations = relations.filter((r: any) => r.isActive !== false && r.status !== 'inactive');
    }
    const mapped = relations.map((r: any) => ({
      _id: r._id,
      id: r._id,
      name: r.name,
      description: r.description || '',
      image: r.image || r.icon || '',
      icon: r.image || r.icon || '',
      slug: r.slug,
      isActive: r.isActive !== undefined ? r.isActive : true,
    }));
    return {
      status: 'success',
      data: {
        relations: mapped,
        pagination: { total: mapped.length, page: 1, limit: 100, pages: 1 },
      },
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create new relation/recipient' })
  async createRelation(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
  ) {
    let imageUrl = dto.image || dto.icon || '';
    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'relations',
      );
      imageUrl = uploadRes.key || uploadRes.url;
    }
    const payload = {
      ...dto,
      image: imageUrl,
      icon: imageUrl,
      isActive: dto.isActive !== undefined ? (dto.isActive === true || dto.isActive === 'true') : true,
    };
    const relation = await this.filterConfigService.addRecipient(payload);
    return { status: 'success', data: { relation } };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update relation/recipient by ID' })
  async updateRelation(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
  ) {
    let imageUrl = dto.image || dto.icon;
    if (file) {
      const uploadRes = await this.uploadsService.uploadAndCompressImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'relations',
      );
      imageUrl = uploadRes.key || uploadRes.url;
    }
    const payload = {
      ...dto,
      ...(imageUrl !== undefined ? { image: imageUrl, icon: imageUrl } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive === true || dto.isActive === 'true' } : {}),
    };
    const relation = await this.filterConfigService.updateRecipient(id, payload);
    return { status: 'success', data: { relation } };
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Toggle relation/recipient status' })
  async toggleRelationStatus(@Param('id') id: string) {
    const list = await this.filterConfigService.getRecipientsList();
    const found = list.find((r: any) => r._id === id);
    const active = found ? (found as any).isActive : true;
    const relation = await this.filterConfigService.updateRecipient(id, { isActive: !active });
    return { status: 'success', data: { relation } };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Delete relation/recipient by ID' })
  async deleteRelation(@Param('id') id: string) {
    await this.filterConfigService.deleteRecipient(id);
    return { status: 'success', message: 'Relation deleted successfully' };
  }
}
