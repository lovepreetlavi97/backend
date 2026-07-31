import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('🐘 PostgreSQL Database connected successfully via Prisma.');
    } catch (err: any) {
      console.warn('⚠️ PostgreSQL connection notice:', err.message);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (err) {}
  }
}
