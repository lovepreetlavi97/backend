import { AdminsService } from './admins.service';
export declare class AdminsController {
    private readonly adminsService;
    constructor(adminsService: AdminsService);
    getAdmins(): Promise<{
        status: string;
        data: {
            admins: {
                role: import(".prisma/client").$Enums.Role;
                name: string;
                isActive: boolean;
                id: string;
                email: string;
                createdAt: Date;
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
                role: import(".prisma/client").$Enums.Role;
                name: string;
                id: string;
                email: string;
                createdAt: Date;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
        };
    }>;
}
