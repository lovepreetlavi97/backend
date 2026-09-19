import { PrismaService } from '../prisma/prisma.service';
export declare class AdminsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        role: import(".prisma/client").$Enums.Role;
        name: string;
        isActive: boolean;
        id: string;
        email: string;
        createdAt: Date;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        lastLogin: Date;
    }[]>;
    createAdmin(dto: {
        name: string;
        email: string;
        password: string;
        role?: any;
        permissions?: string[];
    }): Promise<{
        role: import(".prisma/client").$Enums.Role;
        name: string;
        id: string;
        email: string;
        createdAt: Date;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
