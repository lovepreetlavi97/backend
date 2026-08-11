import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterVendorDto,
  UpdateVendorProfileDto,
} from './dto/vendor.dto';

@Injectable()
export class VendorService {
  constructor(private readonly prisma: PrismaService) {}

  async registerVendor(userId: string, dto: RegisterVendorDto) {
    const existingVendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (existingVendor) {
      throw new ConflictException('Vendor account already registered for this user.');
    }

    // Promote user role to VENDOR
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'VENDOR' },
    });

    const vendor = await this.prisma.vendor.create({
      data: {
        userId,
        shopName: dto.shopName,
        legalName: dto.legalName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        gstin: dto.gstin,
        status: 'PENDING',
      },
    });

    return vendor;
  }

  async getVendorStatus(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor application not found.');
    }

    return {
      vendorId: vendor.id,
      shopName: vendor.shopName,
      status: vendor.status,
      rejectionReason: vendor.rejectionReason,
      createdAt: vendor.createdAt,
    };
  }

  async getVendorProfile(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found.');
    }

    return vendor;
  }

  async updateVendorProfile(vendorId: string, dto: UpdateVendorProfileDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found.');
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        shopName: dto.shopName || vendor.shopName,
        legalName: dto.legalName !== undefined ? dto.legalName : vendor.legalName,
        phone: dto.phone !== undefined ? dto.phone : vendor.phone,
        address: dto.address !== undefined ? dto.address : vendor.address,
        city: dto.city !== undefined ? dto.city : vendor.city,
        state: dto.state !== undefined ? dto.state : vendor.state,
        pincode: dto.pincode !== undefined ? dto.pincode : vendor.pincode,
        gstin: dto.gstin !== undefined ? dto.gstin : vendor.gstin,
        // If rejected, updating profile sets status back to UNDER_REVIEW
        status: vendor.status === 'REJECTED' ? 'UNDER_REVIEW' : vendor.status,
      },
    });
  }

  // === Admin Methods ===
  async getAllVendors(status?: string) {
    return this.prisma.vendor.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { products: true, vendorOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveVendor(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found.');
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'APPROVED',
        rejectionReason: null,
      },
    });
  }

  async rejectVendor(vendorId: string, reason: string) {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Rejection reason is required.');
    }

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found.');
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });
  }

  async suspendVendor(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found.');
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'SUSPENDED' },
    });
  }
}
