import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';

@Injectable()
export class MetalsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapMetal(metal: any) {
    return {
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
    };
  }

  async getMetals() {
    const metals = await this.prisma.metal.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return metals.map((m) => this.mapMetal(m));
  }

  async getMetal(id: string) {
    const metal = await this.prisma.metal.findUnique({
      where: { id },
    });

    if (!metal) {
      throw new NotFoundException(`Metal with ID '${id}' not found.`);
    }

    return this.mapMetal(metal);
  }

  async createMetal(dto: CreateMetalDto) {
    const metal = await this.prisma.metal.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        colorCode: dto.colorCode || '#c5a059',
        gradient: dto.gradient || 'linear-gradient(to right, #c5a059, #e0c283)',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.mapMetal(metal);
  }

  async updateMetal(id: string, dto: UpdateMetalDto) {
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

    return this.mapMetal(metal);
  }

  async deleteMetal(id: string) {
    await this.prisma.metal.delete({ where: { id } }).catch(() => null);
  }
}
