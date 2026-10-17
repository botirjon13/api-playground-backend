import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, RolesGuard],
})
export class CoursesModule {}
