import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsString,
  IsNotIn,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CourseLessonDto } from './course-lesson.dto';

export class CreateCourseDto {
  @ApiProperty({ example: 'rest-api-xavfsizligi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @IsNotIn(['manage', 'mine'])
  @MinLength(3)
  @MaxLength(100)
  slug!: string;

  @ApiProperty({ example: 'REST API xavfsizligi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'API xavfsizligini amaliy mashqlar bilan o‘rganing.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ example: 'Boshlang‘ich' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  level!: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  isFree!: boolean;

  @ApiProperty({ type: CourseLessonDto, isArray: true })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CourseLessonDto)
  lessons!: CourseLessonDto[];
}
