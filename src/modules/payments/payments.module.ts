import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [AuthModule, RedisModule, EmailModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
