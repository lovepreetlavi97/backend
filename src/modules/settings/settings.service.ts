import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_PUBLIC_SETTINGS = {
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
    instagramAccounts: [{ handle: '@guru.jewellers', url: 'https://www.instagram.com/gurujewellers/' }],
    instagramHashtag: '#GURUJEWELLERS',
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
  trustBadges: [
    {
      id: '1',
      icon: 'Award',
      title: '100% Certified Jewellery',
      description: 'SGL & IGI certified diamonds with 916 BIS Hallmark Gold.',
    },
    {
      id: '2',
      icon: 'ShieldCheck',
      title: 'Lifetime Guarantee',
      description: 'Complete transparency with lifetime exchange and buyback assurance.',
    },
    {
      id: '3',
      icon: 'Truck',
      title: 'Insured Transit',
      description: '100% insured, secure doorstep delivery worldwide.',
    },
    {
      id: '4',
      icon: 'RefreshCw',
      title: '15-Day Easy Returns',
      description: 'Hassle-free 15-day return policy with full money-back promise.',
    },
  ],
  featureBadges: [],
  footerAbout:
    'Guru Jewellers is a premier online jewelry boutique specializing in handcrafted gold, silver, and diamond masterpieces.',
  legal: {
    termsOfUse: '<p>Welcome to Guru Jewellers. By using our services, you agree to our terms of use...</p>',
    privacyPolicy: '<p>Your privacy is important to us. We secure all your data...</p>',
  },
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSettings() {
    const dbSetting = await this.prisma.setting.findUnique({
      where: { key: 'public_settings' },
    });

    if (dbSetting && dbSetting.value && typeof dbSetting.value === 'object') {
      const dbVal = dbSetting.value as Record<string, any>;
      return {
        ...DEFAULT_PUBLIC_SETTINGS,
        ...dbVal,
        trustBadges: Array.isArray(dbVal.trustBadges)
          ? dbVal.trustBadges
          : DEFAULT_PUBLIC_SETTINGS.trustBadges,
      };
    }

    return DEFAULT_PUBLIC_SETTINGS;
  }

  async updatePublicSettings(data: any) {
    const existing = await this.prisma.setting.findUnique({
      where: { key: 'public_settings' },
    });

    const existingVal = (existing?.value && typeof existing.value === 'object')
      ? (existing.value as Record<string, any>)
      : DEFAULT_PUBLIC_SETTINGS;

    const mergedValue = {
      ...existingVal,
      ...data,
      brand: data.brand !== undefined ? { ...existingVal.brand, ...data.brand } : existingVal.brand,
      contact: data.contact !== undefined ? { ...existingVal.contact, ...data.contact } : existingVal.contact,
      social: data.social !== undefined ? { ...existingVal.social, ...data.social } : existingVal.social,
      links: data.links !== undefined ? { ...existingVal.links, ...data.links } : existingVal.links,
      trustBadges: data.trustBadges !== undefined ? data.trustBadges : existingVal.trustBadges,
      featureBadges: data.featureBadges !== undefined ? data.featureBadges : existingVal.featureBadges,
      footerAbout: data.footerAbout !== undefined ? data.footerAbout : existingVal.footerAbout,
    };

    const updated = await this.prisma.setting.upsert({
      where: { key: 'public_settings' },
      update: { value: mergedValue },
      create: {
        key: 'public_settings',
        value: mergedValue,
      },
    });

    return updated.value;
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
