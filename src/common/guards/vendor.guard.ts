import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class VendorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      return true; // Admins bypass vendor check
    }

    if (user.role !== 'VENDOR') {
      throw new ForbiddenException('Access denied: Vendor account required.');
    }

    // Server-side Ownership Verification: Fetch Vendor entity linked to user
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      throw new ForbiddenException('No vendor account registered for this user.');
    }

    if (vendor.status === 'SUSPENDED' || vendor.status === 'DEACTIVATED') {
      throw new ForbiddenException(`Vendor account is currently ${vendor.status.toLowerCase()}.`);
    }

    // Attach server-derived vendorId to request object (NEVER TRUST CLIENT vendorId)
    request.user.vendorId = vendor.id;
    request.user.vendorStatus = vendor.status;

    return true;
  }
}
