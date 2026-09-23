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
        data: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | {
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
                id: string;
                email: string;
                name: string;
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
                id: string;
                createdAt: Date;
                description: string;
                status: string;
                userId: string;
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
                id: string;
                createdAt: Date;
                description: string;
                images: string[];
                status: string;
                userId: string;
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
