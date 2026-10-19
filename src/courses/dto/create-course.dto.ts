import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsInt,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsNotIn,
  Matches,
  MaxLength,
  MinLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CourseLessonDto } from './course-lesson.dto';
import { CourseFinalQuestionDto } from './course-final-question.dto';

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

  @ApiProperty({ required: false, example: 70, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  passingScore?: number;

  @ApiProperty({ type: CourseLessonDto, isArray: true })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CourseLessonDto)
  lessons!: CourseLessonDto[];

  @ApiProperty({ type: CourseFinalQuestionDto, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CourseFinalQuestionDto)
  finalQuestions?: CourseFinalQuestionDto[];
}
