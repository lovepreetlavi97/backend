import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<{
        status: string;
        data: {
            profile: {
                id: string;
                email: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
            };
        };
    }>;
    updateProfile(userId: string, dto: {
        name?: string;
        phone?: string;
    }): Promise<{
        status: string;
        message: string;
        data: {
            profile: {
                id: string;
                email: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                updatedAt: Date;
                phone: string;
            };
        };
    }>;
    getAllUsers(): Promise<{
        status: string;
        data: {
            users: {
                id: string;
                email: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                isActive: boolean;
                createdAt: Date;
                phone: string;
            }[];
        };
    }>;
}
