import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  controllers: [AdsController],
  providers: [AdsService, RolesGuard],
})
export class AdsModule {}
