import { SettingsService } from './settings.service';
import { FilterConfigService } from './filter-config.service';
import { UpdateGiftStoreConfigDto } from './dto/filter-config.dto';
export declare class SettingsController {
    private readonly settingsService;
    private readonly filterConfigService;
    constructor(settingsService: SettingsService, filterConfigService: FilterConfigService);
    getPublicSettings(): Promise<{
        status: number;
        message: string;
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
    getAdminSettings(): Promise<{
        status: number;
        message: string;
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
    updateAdminSettings(dto: any): Promise<{
        status: number;
        message: string;
        data: import("@prisma/client/runtime/library").JsonValue;
    }>;
    contact(dto: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }): Promise<{
        status: string;
        message: string;
        data: {
            contact: {
                name: string;
                id: string;
                email: string;
                createdAt: Date;
                subject: string;
                message: string;
            };
        };
    }>;
    grievance(userId: string, dto: {
        subject: string;
        description: string;
    }): Promise<{
        status: string;
        message: string;
        data: {
            grievance: {
                description: string;
                id: string;
                createdAt: Date;
                userId: string;
                status: string;
                subject: string;
            };
        };
    }>;
    designRequest(userId: string, dto: {
        description: string;
        images?: string[];
    }): Promise<{
        status: string;
        message: string;
        data: {
            request: {
                description: string;
                id: string;
                createdAt: Date;
                userId: string;
                status: string;
                images: string[];
                quoteAmount: import("@prisma/client/runtime/library").Decimal | null;
            };
        };
    }>;
    updateGiftStoreConfig(dto: UpdateGiftStoreConfigDto): Promise<{
        status: string;
        message: string;
        data: import("./dto/filter-config.dto").GiftStoreConfig;
    }>;
}
