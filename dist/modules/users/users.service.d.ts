import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapUser;
    getProfile(userId: string): Promise<{
        _id: any;
        id: any;
        name: any;
        email: any;
        phone: any;
        phoneNumber: any;
        role: any;
        status: string;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateProfile(userId: string, data: {
        name?: string;
        phone?: string;
    }): Promise<{
        _id: any;
        id: any;
        name: any;
        email: any;
        phone: any;
        phoneNumber: any;
        role: any;
        status: string;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAllUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        users: {
            _id: any;
            id: any;
            name: any;
            email: any;
            phone: any;
            phoneNumber: any;
            role: any;
            status: string;
            isActive: any;
            createdAt: any;
            updatedAt: any;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    createUser(dto: {
        name: string;
        email: string;
        password?: string;
        role?: string;
        status?: string;
        phone?: string;
    }): Promise<{
        _id: any;
        id: any;
        name: any;
        email: any;
        phone: any;
        phoneNumber: any;
        role: any;
        status: string;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateUser(id: string, dto: {
        name?: string;
        email?: string;
        phone?: string;
        role?: string;
        status?: string;
        password?: string;
    }): Promise<{
        _id: any;
        id: any;
        name: any;
        email: any;
        phone: any;
        phoneNumber: any;
        role: any;
        status: string;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
    }>;
}
