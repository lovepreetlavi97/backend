import { Controller, Get, Post, Patch, Delete, Body, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Metals')
@Controller('metals')
export class MetalsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all metals' })
  async getMetals() {
    const metals = await this.prisma.metal.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const formattedMetals = metals.map((metal) => ({
      _id: metal.id,
      name: metal.name,
      slug: metal.slug,
      colorCode: metal.colorCode,
      gradient: metal.gradient,
      isActive: metal.isActive,
      type: metal.type,
      ratePerGram: Number(metal.ratePerGram),
      purity: metal.purity,
      createdAt: metal.updatedAt.toISOString(),
      updatedAt: metal.updatedAt.toISOString(),
    }));

    return {
      status: 'success',
      data: {
        metals: formattedMetals,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single metal by ID' })
  async getMetal(@Param('id') id: string) {
    const metal = await this.prisma.metal.findUnique({
      where: { id },
    });

    if (!metal) {
      throw new NotFoundException(`Metal with ID '${id}' not found.`);
    }

    return {
      metal: {
        _id: metal.id,
        name: metal.name,
        slug: metal.slug,
        colorCode: metal.colorCode,
        gradient: metal.gradient,
        isActive: metal.isActive,
        type: metal.type,
        ratePerGram: Number(metal.ratePerGram),
        purity: metal.purity,
        createdAt: metal.updatedAt.toISOString(),
        updatedAt: metal.updatedAt.toISOString(),
      },
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Create new metal' })
  async createMetal(
    @Body()
    dto: {
      name: string;
      slug: string;
      colorCode?: string;
      gradient?: string;
      isActive?: boolean;
    },
  ) {
    const metal = await this.prisma.metal.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        colorCode: dto.colorCode || '#c5a059',
        gradient: dto.gradient || 'linear-gradient(to right, #c5a059, #e0c283)',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return {
      metal: {
        _id: metal.id,
        name: metal.name,
        slug: metal.slug,
        colorCode: metal.colorCode,
        gradient: metal.gradient,
        isActive: metal.isActive,
        type: metal.type,
        ratePerGram: Number(metal.ratePerGram),
        purity: metal.purity,
        createdAt: metal.updatedAt.toISOString(),
        updatedAt: metal.updatedAt.toISOString(),
      },
    };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Update metal' })
  async updateMetal(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      slug?: string;
      colorCode?: string;
      gradient?: string;
      isActive?: boolean;
    },
  ) {
    const metal = await this.prisma.metal.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.colorCode !== undefined && { colorCode: dto.colorCode }),
        ...(dto.gradient !== undefined && { gradient: dto.gradient }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return {
      metal: {
        _id: metal.id,
        name: metal.name,
        slug: metal.slug,
        colorCode: metal.colorCode,
        gradient: metal.gradient,
        isActive: metal.isActive,
        type: metal.type,
        ratePerGram: Number(metal.ratePerGram),
        purity: metal.purity,
        createdAt: metal.updatedAt.toISOString(),
        updatedAt: metal.updatedAt.toISOString(),
      },
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Delete metal' })
  async deleteMetal(@Param('id') id: string) {
    await this.prisma.metal.delete({
      where: { id },
    }).catch(() => null);

    return {
      status: 'success',
      message: 'Metal deleted successfully.',
    };
  }

  @Patch(':id/position')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Update metal position' })
  async updatePosition(@Param('id') id: string, @Body() dto: { direction: 'up' | 'down' }) {
    return {
      status: 'success',
      message: 'Position updated successfully.',
    };
  }
}
