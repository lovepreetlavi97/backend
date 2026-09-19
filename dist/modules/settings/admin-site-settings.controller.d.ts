import { SettingsService } from './settings.service';
export declare class AdminSiteSettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSiteSettings(): Promise<{
        status: string;
        data: {
            trustBadges: any[];
            brand: {
                name: string;
                tagline: string;
                logoUrl: string;
            };
            contact: {
                email: string;
                phone: string;
                whatsapp: string;
                address: string;
                googleMapUrl: string;
                businessHours: string;
            };
            social: {
                instagram: string;
                facebook: string;
                youtube: string;
                twitter: string;
                instagramAccounts: {
                    handle: string;
                    url: string;
                }[];
                instagramHashtag: string;
            };
            links: {
                instagramPageLinks: {
                    label: string;
                    url: string;
                }[];
                footerLinks: {
                    label: string;
                    url: string;
                }[];
            };
            featureBadges: string[];
            footerAbout: string;
        };
    }>;
    updateSiteSettings(dto: any): Promise<{
        status: string;
        message: string;
        data: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
