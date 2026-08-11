import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { FilterConfigService } from './filter-config.service';
import { UpdateGiftStoreConfigDto } from './dto/filter-config.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Settings & Customer Inquiries')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly filterConfigService: FilterConfigService,
  ) {}

  @Get('public')
  @ApiOperation({ summary: 'Get public site settings' })
  async getPublicSettings() {
    const data = await this.settingsService.getPublicSettings();
    return {
      status: 200,
      message: 'Site settings fetched successfully.',
      data,
    };
  }

  @Post('contact')
  @ApiOperation({ summary: 'Submit Contact Us enquiry form' })
  async contact(@Body() dto: { name: string; email: string; subject: string; message: string }) {
    const result = await this.settingsService.submitContactForm(dto);
    return { status: 'success', message: 'We will get back to you soon.', data: { contact: result } };
  }

  @Post('grievance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit customer grievance ticket' })
  async grievance(@CurrentUser('id') userId: string, @Body() dto: { subject: string; description: string }) {
    const result = await this.settingsService.submitGrievance(userId, dto);
    return { status: 'success', message: 'Grievance submitted successfully.', data: { grievance: result } };
  }

  @Post('design-request')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit custom jewellery design request' })
  async designRequest(@CurrentUser('id') userId: string, @Body() dto: { description: string; images?: string[] }) {
    const result = await this.settingsService.submitDesignRequest(userId, dto);
    return { status: 'success', message: 'Custom design request submitted.', data: { request: result } };
  }

  @Put('gift-store-config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update Gift Store & Filter configuration' })
  async updateGiftStoreConfig(@Body() dto: UpdateGiftStoreConfigDto) {
    const updated = await this.filterConfigService.updateGiftStoreConfig(dto);
    return {
      status: 'success',
      message: 'Filter configuration updated successfully.',
      data: updated,
    };
  }
}
