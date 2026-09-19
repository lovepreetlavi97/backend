"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = exports.DEFAULT_PUBLIC_SETTINGS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
exports.DEFAULT_PUBLIC_SETTINGS = {
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
    featureBadges: [
        '100% Certified Jewellery',
        'Free Insured Shipping',
        'Easy 15-Day Returns',
        'Lifetime Exchange Policy',
    ],
    footerAbout: 'Guru Jewellers is a premier online jewelry boutique specializing in handcrafted gold, silver, and diamond masterpieces.',
};
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublicSettings() {
        const dbSetting = await this.prisma.setting.findUnique({
            where: { key: 'public_settings' },
        });
        if (dbSetting && dbSetting.value && typeof dbSetting.value === 'object') {
            const dbVal = dbSetting.value;
            return {
                ...exports.DEFAULT_PUBLIC_SETTINGS,
                ...dbVal,
                trustBadges: Array.isArray(dbVal.trustBadges)
                    ? dbVal.trustBadges
                    : exports.DEFAULT_PUBLIC_SETTINGS.trustBadges,
            };
        }
        return exports.DEFAULT_PUBLIC_SETTINGS;
    }
    async updatePublicSettings(data) {
        const existing = await this.prisma.setting.findUnique({
            where: { key: 'public_settings' },
        });
        const existingVal = (existing?.value && typeof existing.value === 'object')
            ? existing.value
            : exports.DEFAULT_PUBLIC_SETTINGS;
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
    async submitContactForm(dto) {
        return this.prisma.contact.create({ data: dto });
    }
    async submitGrievance(userId, dto) {
        return this.prisma.grievance.create({
            data: {
                userId,
                subject: dto.subject,
                description: dto.description,
            },
        });
    }
    async submitDesignRequest(userId, dto) {
        return this.prisma.designRequest.create({
            data: {
                userId,
                description: dto.description,
                images: dto.images || [],
            },
        });
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map