import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies && request.cookies.accessToken) {
      token = request.cookies.accessToken;
    }

    if (!token) {
      return true; // Allow guest request to proceed
    }

    try {
      const isBlacklisted = await this.redisService.get(`blacklist_${token}`);
      if (!isBlacklisted) {
        const decoded = this.authService.verifyToken(token);
        request.user = decoded;
      }
    } catch (e) {
      // Ignore token verification errors for guests
    }

    return true;
  }
}
