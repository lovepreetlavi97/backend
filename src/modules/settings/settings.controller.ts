import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Settings & Customer Inquiries')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('public')
  @ApiOperation({ summary: 'Get public site settings' })
  async getPublicSettings() {
    const dbSetting = await this.prisma.setting.findUnique({
      where: { key: 'public_settings' },
    });

    if (dbSetting) {
      return {
        status: 200,
        message: 'Site settings fetched successfully.',
        data: dbSetting.value,
      };
    }

    return {
      status: 200,
      message: 'Site settings fetched successfully.',
      data: {
        brand: {
          name: 'Guru Jewellers',
          tagline: 'Crafting Elegance Since 1997',
          logoUrl: '/logo.png',
        },
        contact: {
          email: 'support@gurujewellers.com',
          phone: '+91 98765 43210',
          whatsapp: '+91 98765 43210',
          address: 'Guru Jewellers, Luxury Street, Mumbai, India',
          googleMapUrl: 'https://maps.google.com',
          businessHours: '10:00 AM - 8:00 PM',
        },
        social: {
          instagram: 'https://instagram.com/gurujewellers',
          facebook: 'https://facebook.com/gurujewellers',
          youtube: 'https://youtube.com/gurujewellers',
          twitter: 'https://twitter.com/gurujewellers',
        },
        links: {
          instagramPageLinks: [
            { label: 'Follow Us', url: 'https://instagram.com/gurujewellers' }
          ],
          footerLinks: [
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Terms of Service', url: '/terms' }
          ]
        },
        featureBadges: [
          '100% Certified Jewellery',
          'Free Insured Shipping',
          'Easy 15-Day Returns',
          'Lifetime Exchange Policy'
        ],
        footerAbout: 'Guru Jewellers is a premier online jewelry boutique specializing in handcrafted gold, silver, and diamond masterpieces.'
      }
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
}
