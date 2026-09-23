import { PrismaService } from '../prisma/prisma.service';
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPublicSettings(): Promise<string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | {
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
    }>;
    submitContactForm(dto: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        subject: string;
        message: string;
    }>;
    submitGrievance(userId: string, dto: {
        subject: string;
        description: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: string;
        userId: string;
        subject: string;
    }>;
    submitDesignRequest(userId: string, dto: {
        description: string;
        images?: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        images: string[];
        status: string;
        userId: string;
        quoteAmount: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
