import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AdminOverviewStatsDto {
  @ApiProperty({ example: 125 })
  totalUsers!: number;

  @ApiProperty({ example: 2 })
  admins!: number;

  @ApiProperty({ example: 0 })
  moderators!: number;

  @ApiProperty({ example: 123 })
  students!: number;

  @ApiProperty({ example: 24 })
  mission1Completed!: number;

  @ApiProperty({ example: 860 })
  totalXp!: number;
}

export class RecentStudentDto {
  @ApiProperty({ example: '2ef32d9d-3b82-4f52-a5dd-abc7c3f4fd28' })
  id!: string;

  @ApiProperty({ example: 'student@example.com' })
  email!: string;

  @ApiProperty({ example: 'Student Name', nullable: true })
  fullName!: string | null;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  role!: Role;

  @ApiProperty({ example: 10 })
  xp!: number;

  @ApiProperty({ example: true })
  mission1!: boolean;

  @ApiProperty({ example: '2026-10-16T15:00:00.000Z' })
  createdAt!: Date;
}

export class AdminOverviewDto {
  @ApiProperty({ type: AdminOverviewStatsDto })
  stats!: AdminOverviewStatsDto;

  @ApiProperty({ type: [RecentStudentDto] })
  recentStudents!: RecentStudentDto[];
}
