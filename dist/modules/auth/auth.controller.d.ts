import { Response, Request } from 'express';
import { AuthService, RegisterUserDto, LoginUserDto, PhoneOtpDto, VerifyOtpDto } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    requestPhoneOtp(dto: PhoneOtpDto): Promise<{
        status: string;
        message: string;
        userRegistered: boolean;
        data: {
            userRegistered: boolean;
        };
    }>;
    resendPhoneOtp(dto: PhoneOtpDto): Promise<{
        status: string;
        message: string;
        userRegistered: boolean;
        data: {
            userRegistered: boolean;
        };
    }>;
    verifyPhoneOtp(dto: VerifyOtpDto, res: Response): Promise<{
        status: string;
        message: string;
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
        data: {
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
        };
    }>;
    register(dto: RegisterUserDto, res: Response): Promise<{
        status: string;
        message: string;
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
        data: {
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
        };
    }>;
    login(dto: LoginUserDto, res: Response): Promise<{
        status: string;
        message: string;
        user: any;
        token: string;
        data: {
            accessToken: string;
            refreshToken: string;
            user: any;
            token: string;
        };
    }>;
    googleLogin(dto: {
        code: string;
    }, res: Response): Promise<{
        status: string;
        message: string;
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
        data: {
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
        };
    }>;
    refresh(req: Request, res: Response): Promise<{
        status: string;
        data: {
            accessToken: string;
        };
    }>;
    logout(req: Request, res: Response): Promise<{
        status: string;
        message: string;
    }>;
}
