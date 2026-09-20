import { AdminsService } from './admins.service';
export declare class AdminsController {
    private readonly adminsService;
    constructor(adminsService: AdminsService);
    getAdmins(): Promise<{
        status: string;
        data: {
            admins: {
                id: string;
                createdAt: Date;
                name: string;
                isActive: boolean;
                email: string;
                role: import(".prisma/client").$Enums.Role;
                permissions: import("@prisma/client/runtime/library").JsonValue;
                lastLogin: Date;
            }[];
        };
    }>;
    createAdmin(dto: {
        name: string;
        email: string;
        password: string;
        role?: any;
        permissions?: string[];
    }): Promise<{
        status: string;
        message: string;
        data: {
            admin: {
                id: string;
                createdAt: Date;
                name: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
        };
    }>;
}
