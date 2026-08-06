import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Get active promotional banners and collections' })
  async getActiveBanners(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const banners = await this.bannersService.findAll({ type, status });
    return { status: 'success', data: { banners } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get banner by ID' })
  async getBannerById(@Param('id') id: string) {
    const banner = await this.bannersService.findById(id);
    return { status: 'success', data: { banner } };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Admin: Create new promotional banner' })
  async createBanner(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const banner = await this.bannersService.createBanner(body, file);
    return { status: 'success', message: 'Banner created successfully.', data: { banner } };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Admin: Update promotional banner' })
  async updateBanner(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const banner = await this.bannersService.updateBanner(id, body, file);
    return { status: 'success', message: 'Banner updated successfully.', data: { banner } };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Delete banner' })
  async deleteBanner(@Param('id') id: string) {
    await this.bannersService.deleteBanner(id);
    return { status: 'success', message: 'Banner deleted successfully.' };
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Toggle banner status' })
  async toggleStatus(@Param('id') id: string) {
    const banner = await this.bannersService.toggleStatus(id);
    return { status: 'success', message: 'Status updated.', data: { banner } };
  }

  @Patch(':id/position')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Update banner position' })
  async updatePosition(
    @Param('id') id: string,
    @Body('direction') direction: 'up' | 'down',
  ) {
    await this.bannersService.updatePosition(id, direction);
    return { status: 'success', message: 'Position updated.' };
  }
}
