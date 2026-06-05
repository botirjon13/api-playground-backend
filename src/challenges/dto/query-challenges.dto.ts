import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class QueryChallengesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(50, { message: 'limit cannot exceed 50' })
  limit?: number = 10;

  @IsOptional()
  @IsEnum(Difficulty, { message: 'difficulty must be one of: EASY, MEDIUM, HARD' })
  difficulty?: Difficulty;

  @IsOptional()
  @IsString({ message: 'category must be a string' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'sort must be either asc or desc' })
  sort?: 'asc' | 'desc' = 'desc';
}
