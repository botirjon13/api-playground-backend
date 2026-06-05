import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { PaginatedChallengesResponseDto } from './dto/paginated-challenges-response.dto';
import { QueryChallengesDto } from './dto/query-challenges.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeEntity } from './entities/challenge.entity';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  @ApiOperation({
    summary: 'List challenges with pagination, filtering, search, and sorting.',
    description: 'Retrieve challenges with optional pagination, filtering by difficulty/category, full-text search, and sorting capabilities.',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (1-indexed). Default is 1.',
    required: false,
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results per page (1-50). Default is 10.',
    required: false,
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'difficulty',
    description: 'Filter by difficulty level.',
    required: false,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    example: 'EASY',
  })
  @ApiQuery({
    name: 'category',
    description: 'Filter by category (case-insensitive partial match).',
    required: false,
    example: 'Backend',
    type: String,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search in challenge title and description (case-insensitive partial match).',
    required: false,
    example: 'jwt',
    type: String,
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort by creation date (asc for oldest first, desc for newest first). Default is desc.',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiOkResponse({
    description: 'Challenges retrieved successfully with pagination metadata.',
    type: PaginatedChallengesResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  findAll(@Query() query: QueryChallengesDto): Promise<PaginatedChallengesResponseDto> {
    return this.challengesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get challenge details.' })
  @ApiParam({ name: 'id', description: 'Challenge identifier.' })
  @ApiOkResponse({ description: 'Challenge retrieved successfully.', type: ChallengeEntity })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  findOne(@Param('id') id: string): Promise<ChallengeEntity> {
    return this.challengesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create challenge (ADMIN only).' })
  @ApiBody({
    type: CreateChallengeDto,
    examples: {
      example1: {
        summary: 'Create a new challenge',
        value: {
          title: 'Build authentication flow',
          description: 'Implement user authentication with JWT and Prisma.',
          difficulty: 'MEDIUM',
          category: 'Backend',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Challenge created successfully.', type: ChallengeEntity })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Only ADMIN users can create challenges.' })
  @ApiBadRequestResponse({ description: 'Validation error or invalid request.' })
  create(@Body() createChallengeDto: CreateChallengeDto): Promise<ChallengeEntity> {
    return this.challengesService.create(createChallengeDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update challenge (ADMIN only).' })
  @ApiParam({ name: 'id', description: 'Challenge identifier.' })
  @ApiBody({ type: UpdateChallengeDto })
  @ApiOkResponse({ description: 'Challenge updated successfully.', type: ChallengeEntity })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Only ADMIN users can update challenges.' })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  @ApiBadRequestResponse({ description: 'Validation error or invalid request.' })
  update(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ): Promise<ChallengeEntity> {
    return this.challengesService.update(id, updateChallengeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete challenge (ADMIN only).' })
  @ApiParam({ name: 'id', description: 'Challenge identifier.' })
  @ApiOkResponse({ description: 'Challenge deleted successfully.', schema: { example: { message: 'Challenge deleted successfully' } } })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Only ADMIN users can delete challenges.' })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.challengesService.remove(id);
  }
}
