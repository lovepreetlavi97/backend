import { AdminsService } from './admins.service';
export declare class AdminsController {
    private readonly adminsService;
    constructor(adminsService: AdminsService);
    getAdmins(): Promise<{
        status: string;
        data: {
            admins: {
                id: string;
                email: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                permissions: import("@prisma/client/runtime/library").JsonValue;
                isActive: boolean;
                lastLogin: Date;
                createdAt: Date;
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
                email: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                permissions: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
            };
        };
    }>;
}
