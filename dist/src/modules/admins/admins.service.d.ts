import { PrismaService } from '../prisma/prisma.service';
export declare class AdminsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        lastLogin: Date;
        createdAt: Date;
    }[]>;
    createAdmin(dto: {
        name: string;
        email: string;
        password: string;
        role?: any;
        permissions?: string[];
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }>;
}
