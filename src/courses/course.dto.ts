import { ApiProperty } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';

export class CourseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  level!: string;

  @ApiProperty()
  isFree!: boolean;

  @ApiProperty({ nullable: true })
  priceCents!: number | null;

  @ApiProperty({ enum: CourseStatus })
  status!: CourseStatus;
}

export class CourseEnrollmentDto {
  @ApiProperty()
  enrolledAt!: Date;

  @ApiProperty({ type: CourseDto })
  course!: CourseDto;
}
