import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSettings() {
    const dbSetting = await this.prisma.setting.findUnique({
      where: { key: 'public_settings' },
    });

    if (dbSetting) {
      return dbSetting.value;
    }

    return {
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
          { label: 'Follow Us', url: 'https://instagram.com/gurujewellers' },
        ],
        footerLinks: [
          { label: 'Privacy Policy', url: '/privacy' },
          { label: 'Terms of Service', url: '/terms' },
        ],
      },
      featureBadges: [
        '100% Certified Jewellery',
        'Free Insured Shipping',
        'Easy 15-Day Returns',
        'Lifetime Exchange Policy',
      ],
      footerAbout:
        'Guru Jewellers is a premier online jewelry boutique specializing in handcrafted gold, silver, and diamond masterpieces.',
    };
  }

  async submitContactForm(dto: { name: string; email: string; subject: string; message: string }) {
    return this.prisma.contact.create({ data: dto });
  }

  async submitGrievance(userId: string, dto: { subject: string; description: string }) {
    return this.prisma.grievance.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
      },
    });
  }

  async submitDesignRequest(userId: string, dto: { description: string; images?: string[] }) {
    return this.prisma.designRequest.create({
      data: {
        userId,
        description: dto.description,
        images: dto.images || [],
      },
    });
  }
}
