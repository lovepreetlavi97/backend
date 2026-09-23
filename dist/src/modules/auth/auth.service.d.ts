import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
export interface RegisterUserDto {
    name: string;
    email: string;
    phone?: string;
    password: string;
}
export interface LoginUserDto {
    email: string;
    password: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly redis;
    private readonly jwtSecret;
    constructor(prisma: PrismaService, redis: RedisService);
    register(dto: RegisterUserDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            isDeleted: boolean;
        };
    }>;
    login(dto: LoginUserDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    generateTokens(userId: string, email: string, role: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(refreshToken: string, token: string): Promise<{
        message: string;
    }>;
    verifyToken(token: string): any;
}
