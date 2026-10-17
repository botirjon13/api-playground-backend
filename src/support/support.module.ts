import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  controllers: [SupportController],
  providers: [SupportService, RolesGuard],
})
export class SupportModule {}
