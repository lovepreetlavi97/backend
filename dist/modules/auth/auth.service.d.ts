import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
export interface RegisterUserDto {
    name: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
    countryCode?: string;
    password?: string;
    subscribe?: boolean;
}
export interface LoginUserDto {
    email: string;
    password: string;
}
export interface PhoneOtpDto {
    countryCode?: string;
    phoneNumber?: string;
    phone?: string;
}
export interface VerifyOtpDto {
    countryCode?: string;
    phoneNumber?: string;
    phone?: string;
    otp: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly redis;
    private readonly jwtSecret;
    private readonly otpCache;
    constructor(prisma: PrismaService, redis: RedisService);
    private normalizePhone;
    requestPhoneOtp(dto: PhoneOtpDto): Promise<{
        userRegistered: boolean;
    }>;
    resendPhoneOtp(dto: PhoneOtpDto): Promise<{
        userRegistered: boolean;
    }>;
    verifyPhoneOtp(dto: VerifyOtpDto): Promise<{
        user: {
            role: import(".prisma/client").$Enums.Role;
            name: string;
            isActive: boolean;
            id: string;
            email: string;
            phone: string | null;
            isDeleted: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
        accessToken: string;
        refreshToken: string;
    }>;
    register(dto: RegisterUserDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            role: import(".prisma/client").$Enums.Role;
            name: string;
            isActive: boolean;
            id: string;
            email: string;
            phone: string | null;
            isDeleted: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    login(dto: LoginUserDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
        token: string;
    }>;
    googleLogin(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            role: import(".prisma/client").$Enums.Role;
            name: string;
            isActive: boolean;
            id: string;
            email: string;
            phone: string | null;
            isDeleted: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
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
