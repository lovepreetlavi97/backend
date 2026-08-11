import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVendorProductDto,
  UpdateVendorProductDto,
} from './dto/vendor.dto';

@Injectable()
export class VendorProductService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(title: string): string {
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomBytes = crypto.randomBytes(2).toString('hex');
    return `${cleanTitle}-${randomBytes}`;
  }

  private generateSku(title: string): string {
    const cleanPrefix = title
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, 'PRD');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `MYG-${cleanPrefix}-${randomHex}`;
  }

  async createVendorProduct(vendorId: string, dto: CreateVendorProductDto) {
    const slug = this.generateSlug(dto.title);
    const sku = this.generateSku(dto.title);

    const approvalStatus = dto.submitForApproval ? 'PENDING_APPROVAL' : 'DRAFT';

    const product = await this.prisma.product.create({
      data: {
        vendorId,
        title: dto.title,
        slug,
        sku,
        description: dto.description,
        images: dto.images || [],
        weightGrams: dto.weightGrams,
        stockQuantity: dto.stockQuantity,
        categoryId: dto.categoryId || undefined,
        subcategoryId: dto.subcategoryId || undefined,
        metalId: dto.metalId || undefined,
        priceRuleId: dto.priceRuleId || undefined,
        approvalStatus,
        isPublished: false, // Unapproved vendor products are NEVER published on customer website
        isDeleted: false,
      },
    });

    return product;
  }

  async getVendorProducts(
    vendorId: string,
    page: number = 1,
    limit: number = 20,
    approvalStatus?: string,
  ) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          vendorId,
          isDeleted: false,
          approvalStatus: approvalStatus ? (approvalStatus as any) : undefined,
        },
        include: { category: true, subcategory: true, metal: true, priceRule: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({
        where: {
          vendorId,
          isDeleted: false,
          approvalStatus: approvalStatus ? (approvalStatus as any) : undefined,
        },
      }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorProductById(vendorId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
    });

    if (!product || product.isDeleted) {
      throw new NotFoundException('Product not found.');
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied: You do not own this product.');
    }

    return product;
  }

  async updateVendorProduct(
    vendorId: string,
    productId: string,
    dto: UpdateVendorProductDto,
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });

    if (!product || product.isDeleted) {
      throw new NotFoundException('Product not found.');
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied: You do not own this product.');
    }

    let approvalStatus = product.approvalStatus;
    if (dto.submitForApproval) {
      approvalStatus = 'PENDING_APPROVAL';
    } else if (product.approvalStatus === 'REJECTED') {
      approvalStatus = 'DRAFT';
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        title: dto.title || product.title,
        description: dto.description || product.description,
        images: dto.images !== undefined ? dto.images : product.images,
        weightGrams: dto.weightGrams !== undefined ? dto.weightGrams : product.weightGrams,
        stockQuantity: dto.stockQuantity !== undefined ? dto.stockQuantity : product.stockQuantity,
        categoryId: dto.categoryId || product.categoryId,
        subcategoryId: dto.subcategoryId || product.subcategoryId,
        metalId: dto.metalId || product.metalId,
        priceRuleId: dto.priceRuleId || product.priceRuleId,
        approvalStatus,
        isPublished: approvalStatus === 'APPROVED' ? product.isPublished : false,
      },
    });
  }

  async deleteVendorProduct(vendorId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });

    if (!product || product.isDeleted) {
      throw new NotFoundException('Product not found.');
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied: You do not own this product.');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { isDeleted: true, isPublished: false },
    });
  }

  // === Admin Review Queue Methods ===
  async getPendingProducts() {
    return this.prisma.product.findMany({
      where: {
        approvalStatus: 'PENDING_APPROVAL',
        isDeleted: false,
      },
      include: {
        vendor: { select: { id: true, shopName: true, email: true } },
        category: true,
        subcategory: true,
        metal: true,
        priceRule: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.isDeleted) {
      throw new NotFoundException('Product not found.');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: 'APPROVED',
        isPublished: true,
        rejectionReason: null,
      },
    });
  }

  async rejectProduct(productId: string, reason: string) {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Rejection reason is required.');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.isDeleted) {
      throw new NotFoundException('Product not found.');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: 'REJECTED',
        isPublished: false,
        rejectionReason: reason,
      },
    });
  }
}
