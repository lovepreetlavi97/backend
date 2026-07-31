import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Settings & Customer Inquiries')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

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
}
