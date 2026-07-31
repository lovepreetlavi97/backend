import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
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
  async getActiveBanners() {
    const banners = await this.bannersService.findAll();
    return { status: 'success', data: { banners } };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Create new promotional banner' })
  async createBanner(@Body() dto: { title: string; image: string; link?: string }) {
    const banner = await this.bannersService.createBanner(dto);
    return { status: 'success', message: 'Banner created successfully.', data: { banner } };
  }
}
