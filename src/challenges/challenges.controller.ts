import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeEntity } from './entities/challenge.entity';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  @ApiOperation({ summary: 'List active challenges.' })
  @ApiOkResponse({ description: 'Active challenges retrieved successfully.', type: [ChallengeEntity] })
  findAll(): Promise<ChallengeEntity[]> {
    return this.challengesService.findAll();
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
  @ApiOperation({ summary: 'Create challenge.' })
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
  @ApiBadRequestResponse({ description: 'Validation error or invalid request.' })
  create(@Body() createChallengeDto: CreateChallengeDto): Promise<ChallengeEntity> {
    return this.challengesService.create(createChallengeDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update challenge.' })
  @ApiParam({ name: 'id', description: 'Challenge identifier.' })
  @ApiBody({ type: UpdateChallengeDto })
  @ApiOkResponse({ description: 'Challenge updated successfully.', type: ChallengeEntity })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  @ApiBadRequestResponse({ description: 'Validation error or invalid request.' })
  update(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ): Promise<ChallengeEntity> {
    return this.challengesService.update(id, updateChallengeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete challenge.' })
  @ApiParam({ name: 'id', description: 'Challenge identifier.' })
  @ApiOkResponse({ description: 'Challenge deleted successfully.', schema: { example: { message: 'Challenge deleted successfully' } } })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.challengesService.remove(id);
  }
}
