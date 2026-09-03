import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Site Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@Controller('admin/site-settings')
export class AdminSiteSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get full site settings including trust badges' })
  async getSiteSettings() {
    const data = await this.settingsService.getPublicSettings();
    return {
      status: 'success',
      data,
    };
  }

  @Put()
  @ApiOperation({ summary: 'Admin: Update site settings and trust badges' })
  async updateSiteSettings(@Body() dto: any) {
    const data = await this.settingsService.updatePublicSettings(dto);
    return {
      status: 'success',
      message: 'Site settings and trust badges updated successfully.',
      data,
    };
  }
}
