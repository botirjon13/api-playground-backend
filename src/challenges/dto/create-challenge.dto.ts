import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Difficulty } from '../entities/challenge.entity';

export class CreateChallengeDto {
  @ApiProperty({ example: 'Build authentication flow', description: 'Challenge title.' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Create a challenge module foundation in NestJS.', description: 'Challenge description.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: Difficulty, example: Difficulty.MEDIUM, description: 'Challenge difficulty level.' })
  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @ApiProperty({ example: 'Backend', description: 'Challenge category.' })
  @IsString()
  @IsNotEmpty()
  category!: string;
}
