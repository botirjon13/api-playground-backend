import { ApiProperty } from '@nestjs/swagger';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class ChallengeEntity {
  @ApiProperty({ example: 'b0f17c64-1d79-4f24-a529-872f2fef0492' })
  id!: string;

  @ApiProperty({ example: 'Build authentication flow' })
  title!: string;

  @ApiProperty({ example: 'Create a challenge module foundation in NestJS.' })
  description!: string;

  @ApiProperty({ enum: Difficulty, example: Difficulty.MEDIUM })
  difficulty!: Difficulty;

  @ApiProperty({ example: 'Backend' })
  category!: string;

  @ApiProperty({ example: true })
  is_active!: boolean;

  @ApiProperty({ example: '2026-06-05T12:00:00.000Z' })
  created_at!: Date;

  @ApiProperty({ example: '2026-06-05T12:00:00.000Z' })
  updated_at!: Date;
}
