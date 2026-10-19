import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { CertificatesController } from './certificates.controller';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController, CertificatesController],
  providers: [CoursesService, RolesGuard],
})
export class CoursesModule {}
