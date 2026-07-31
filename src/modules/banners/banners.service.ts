import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBanner(dto: { title: string; image: string; link?: string }) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        image: dto.image,
        link: dto.link,
      },
    });
  }
}
