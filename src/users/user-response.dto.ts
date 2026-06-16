import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: '2ef32d9d-3b82-4f52-a5dd-abc7c3f4fd28' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  role!: Role;

  @ApiProperty({ example: 0 })
  xp!: number;

  @ApiProperty({ example: false })
  mission1!: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
