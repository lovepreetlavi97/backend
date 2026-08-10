import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController, AdminDashboardController } from './dashboard.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DashboardController, AdminDashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
