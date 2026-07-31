import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
