import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    example: '2ef32d9d-3b82-4f52-a5dd-abc7c3f4fd28',
    description: 'Unique user identifier.',
  })
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address.',
  })
  email!: string;

  @ApiProperty({
    enum: Role,
    example: Role.STUDENT,
    description: 'User role.',
  })
  role!: Role;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Record creation timestamp.',
  })
  created_at!: Date;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Record update timestamp.',
  })
  updated_at!: Date;
}
