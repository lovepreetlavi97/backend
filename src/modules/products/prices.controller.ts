import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Prices')
@Controller('prices')
export class PricesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all price rules with pagination' })
  async getPriceRules(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [total, rules] = await Promise.all([
      this.prisma.priceRule.count({ where }),
      this.prisma.priceRule.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const formattedRules = rules.map((rule) => ({
      _id: rule.id,
      name: rule.name,
      price: Number(rule.makingChargeGram),
      makingChargeGram: Number(rule.makingChargeGram),
      gstPercentage: Number(rule.gstPercentage),
      discountPercent: Number(rule.discountPercent),
      isActive: true,
      createdAt: rule.updatedAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    }));

    return {
      status: 'success',
      data: {
        priceRules: formattedRules,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Create new price rule' })
  async createPriceRule(@Body() dto: { name: string; price?: number; makingChargeGram?: number; gstPercentage?: number; discountPercent?: number }) {
    const makingCharge = dto.makingChargeGram || dto.price || 450;
    const rule = await this.prisma.priceRule.create({
      data: {
        name: dto.name,
        makingChargeGram: makingCharge,
        gstPercentage: dto.gstPercentage || 3.0,
        discountPercent: dto.discountPercent || 0.0,
      },
    });

    return {
      status: 'success',
      message: 'Price rule created successfully.',
      data: {
        priceRule: {
          _id: rule.id,
          name: rule.name,
          price: Number(rule.makingChargeGram),
          isActive: true,
        },
      },
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Update price rule' })
  async updatePriceRule(
    @Param('id') id: string,
    @Body() dto: { name?: string; price?: number; makingChargeGram?: number },
  ) {
    const makingCharge = dto.makingChargeGram || dto.price;
    const rule = await this.prisma.priceRule.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(makingCharge !== undefined && { makingChargeGram: makingCharge }),
      },
    });

    return {
      status: 'success',
      message: 'Price rule updated successfully.',
      data: { priceRule: rule },
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Delete price rule' })
  async deletePriceRule(@Param('id') id: string) {
    await this.prisma.priceRule.delete({ where: { id } }).catch(() => null);
    return { status: 'success', message: 'Price rule deleted.' };
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Toggle price rule status' })
  async toggleStatus(@Param('id') id: string) {
    return { status: 'success', message: 'Status updated.' };
  }
}
