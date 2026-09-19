import { PrismaService } from '../prisma/prisma.service';
export declare const DEFAULT_PUBLIC_SETTINGS: {
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
    trustBadges: {
        id: string;
        icon: string;
        title: string;
        description: string;
    }[];
    featureBadges: string[];
    footerAbout: string;
};
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPublicSettings(): Promise<{
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
    }>;
    updatePublicSettings(data: any): Promise<import("@prisma/client/runtime/library").JsonValue>;
    submitContactForm(dto: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }): Promise<{
        name: string;
        id: string;
        email: string;
        createdAt: Date;
        subject: string;
        message: string;
    }>;
    submitGrievance(userId: string, dto: {
        subject: string;
        description: string;
    }): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        status: string;
        subject: string;
    }>;
    submitDesignRequest(userId: string, dto: {
        description: string;
        images?: string[];
    }): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        status: string;
        images: string[];
        quoteAmount: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
