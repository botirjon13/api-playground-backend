import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CourseDto, CourseEnrollmentDto } from './course.dto';
import { CoursesService } from './courses.service';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List currently published courses.' })
  @ApiOkResponse({ type: CourseDto, isArray: true })
  findPublished(): Promise<CourseDto[]> {
    return this.coursesService.findPublished();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List the authenticated user’s active course enrollments.' })
  @ApiOkResponse({ type: CourseEnrollmentDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT bearer token.' })
  findMine(@CurrentUser() user: JwtUser): Promise<CourseEnrollmentDto[]> {
    return this.coursesService.findMyEnrollments(user.sub);
  }

  @Post(':slug/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enroll the authenticated user in a published free course.' })
  @ApiCreatedResponse({ type: CourseEnrollmentDto })
  @ApiNotFoundResponse({ description: 'Published course was not found.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT bearer token.' })
  enroll(@CurrentUser() user: JwtUser, @Param('slug') slug: string): Promise<CourseEnrollmentDto> {
    return this.coursesService.enroll(user.sub, slug);
  }
}
