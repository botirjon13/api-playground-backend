import { ApiProperty } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCourseStatusDto {
  @ApiProperty({
    enum: [CourseStatus.APPROVED, CourseStatus.REJECTED, CourseStatus.PUBLISHED],
  })
  @IsEnum(CourseStatus)
  status!: CourseStatus;

  @ApiProperty({
    required: false,
    example: 'Birinchi darsdagi amaliy qadamlarni batafsilroq yozing.',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  feedback?: string;
}
