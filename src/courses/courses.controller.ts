import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { CourseDto, CourseEnrollmentDto } from './course.dto';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseStatusDto } from './dto/update-course-status.dto';

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

  @Get('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List courses available to the authenticated staff member.' })
  @ApiOkResponse({ description: 'Managed courses loaded.' })
  @ApiForbiddenResponse({ description: 'Only staff can manage courses.' })
  findManageable(@CurrentUser() user: JwtUser) {
    return this.coursesService.findManageable(user);
  }

  @Post('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a draft course as a moderator.' })
  @ApiCreatedResponse({ description: 'Draft course created.' })
  @ApiForbiddenResponse({ description: 'Only moderators can create courses.' })
  createDraft(@CurrentUser() user: JwtUser, @Body() input: CreateCourseDto) {
    return this.coursesService.createDraft(user, input);
  }

  @Patch('manage/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Edit an owned draft or rejected course.' })
  @ApiOkResponse({ description: 'Course draft updated.' })
  updateDraft(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: CreateCourseDto,
  ) {
    return this.coursesService.updateDraft(user, id, input);
  }

  @Post('manage/:id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit an owned course for administrator review.' })
  @ApiOkResponse({ description: 'Course submitted for review.' })
  submitForReview(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.submitForReview(user, id);
  }

  @Patch('manage/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve, reject, or publish a submitted course.' })
  @ApiOkResponse({ description: 'Course review status updated.' })
  @ApiForbiddenResponse({ description: 'Only administrators can review courses.' })
  updateCourseStatus(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateCourseStatusDto,
  ) {
    return this.coursesService.updateCourseStatus(user, id, input);
  }

  @Get(':slug/content')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Load course lessons for an active enrollee.' })
  @ApiOkResponse({ description: 'Enrolled course content loaded.' })
  @ApiNotFoundResponse({ description: 'Published enrolled course was not found.' })
  findLearningContent(@CurrentUser() user: JwtUser, @Param('slug') slug: string) {
    return this.coursesService.findLearningContent(user, slug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published course and its lesson outline.' })
  @ApiOkResponse({ description: 'Published course loaded.' })
  @ApiNotFoundResponse({ description: 'Published course was not found.' })
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.coursesService.findPublishedBySlug(slug);
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
