import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { RedisService } from '../../shared/redis/redis.service';
export declare class JwtAuthGuard implements CanActivate {
    private readonly authService;
    private readonly redisService;
    constructor(authService: AuthService, redisService: RedisService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
