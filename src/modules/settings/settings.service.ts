import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitContactForm(dto: { name: string; email: string; subject: string; message: string }) {
    return this.prisma.contact.create({ data: dto });
  }

  async submitGrievance(userId: string, dto: { subject: string; description: string }) {
    return this.prisma.grievance.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
      },
    });
  }

  async submitDesignRequest(userId: string, dto: { description: string; images?: string[] }) {
    return this.prisma.designRequest.create({
      data: {
        userId,
        description: dto.description,
        images: dto.images || [],
      },
    });
  }
}
