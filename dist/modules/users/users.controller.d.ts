import { Response } from 'express';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<{
        status: string;
        data: {
            profile: {
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
            };
        };
    }>;
    exportUsers(search?: string, role?: string, status?: string, res?: Response): Promise<Response<any, Record<string, any>> | {
        status: string;
        data: {
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
        };
    }>;
    getAllUsers(pageStr?: string, limitStr?: string, search?: string, role?: string, status?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
        status: string;
        data: {
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
        };
    }>;
    getUserById(id: string): Promise<{
        status: string;
        data: {
            user: {
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
            };
        };
    }>;
    createUser(dto: any): Promise<{
        status: string;
        message: string;
        data: {
            user: {
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
            };
        };
    }>;
    updateUser(id: string, dto: any): Promise<{
        status: string;
        message: string;
        data: {
            user: {
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
            };
        };
    }>;
    patchUser(id: string, dto: any): Promise<{
        status: string;
        message: string;
        data: {
            user: {
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
            };
        };
    }>;
    deleteUser(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
