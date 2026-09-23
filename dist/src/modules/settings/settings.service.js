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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
            footerAbout: 'Guru Jewellers is a premier online jewelry boutique specializing in handcrafted gold, silver, and diamond masterpieces.',
        };
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