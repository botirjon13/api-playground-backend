import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    example: '2ef32d9d-3b82-4f52-a5dd-abc7c3f4fd28',
    description: 'Unique registered user identifier.',
  })
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered user email address.',
  })
  email!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for authenticated requests.',
  })
  access_token!: string;
}
