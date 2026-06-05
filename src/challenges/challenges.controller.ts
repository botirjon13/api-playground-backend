import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
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
  @ApiOperation({ summary: 'List all challenges.' })
  @ApiOkResponse({ type: [ChallengeEntity] })
  findAll(): Promise<ChallengeEntity[]> {
    return this.challengesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get challenge details.' })
  @ApiParam({ name: 'id', description: 'Challenge identifier.' })
  @ApiOkResponse({ type: ChallengeEntity })
  findOne(@Param('id') id: string): Promise<ChallengeEntity> {
    return this.challengesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create challenge.' })
  @ApiBody({ type: CreateChallengeDto })
  @ApiCreatedResponse({ type: ChallengeEntity })
  create(@Body() createChallengeDto: CreateChallengeDto): Promise<ChallengeEntity> {
    return this.challengesService.create(createChallengeDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update challenge.' })
  @ApiParam({ name: 'id', description: 'Challenge identifier.' })
  @ApiBody({ type: UpdateChallengeDto })
  @ApiOkResponse({ type: ChallengeEntity })
  update(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ): Promise<ChallengeEntity> {
    return this.challengesService.update(id, updateChallengeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete challenge.' })
  @ApiParam({ name: 'id', description: 'Challenge identifier.' })
  @ApiOkResponse({ description: 'Challenge deletion placeholder.' })
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.challengesService.remove(id);
  }
}
