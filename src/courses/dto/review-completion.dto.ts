import { ApiProperty } from '@nestjs/swagger';
import { CourseCompletionStatus, FinalTestAttemptStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReviewCompletionDto {
  @ApiProperty({ enum: [CourseCompletionStatus.APPROVED, CourseCompletionStatus.REJECTED] })
  @IsEnum(CourseCompletionStatus)
  status!: CourseCompletionStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  feedback?: string;
}

export class ReviewFinalTestDto {
  @ApiProperty({ enum: [FinalTestAttemptStatus.APPROVED, FinalTestAttemptStatus.REJECTED] })
  @IsEnum(FinalTestAttemptStatus)
  status!: FinalTestAttemptStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  feedback?: string;
}
