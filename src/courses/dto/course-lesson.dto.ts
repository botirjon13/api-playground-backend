import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CourseResourceDto } from './course-resource.dto';

export class CourseLessonDto {
  @ApiProperty({ example: 'REST API nima?' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'Bu darsda REST arxitekturasining asoslarini o‘rganamiz.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @MaxLength(20000)
  content!: string;

  @ApiPropertyOptional({ example: 'https://www.youtube.com/watch?v=example' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  videoUrl?: string;

  @ApiProperty({ type: CourseResourceDto, isArray: true })
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CourseResourceDto)
  resources!: CourseResourceDto[];
}
