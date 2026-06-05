import { ApiProperty } from '@nestjs/swagger';
import { ChallengeEntity } from '../entities/challenge.entity';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of challenges matching the query.' })
  total!: number;

  @ApiProperty({ description: 'Current page number.' })
  page!: number;

  @ApiProperty({ description: 'Number of challenges per page.' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages.' })
  totalPages!: number;
}

export class PaginatedChallengesResponseDto {
  @ApiProperty({ type: [ChallengeEntity], description: 'List of challenges for the current page.' })
  data!: ChallengeEntity[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata.' })
  meta!: PaginationMetaDto;
}
