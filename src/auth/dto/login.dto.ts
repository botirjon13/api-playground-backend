import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User account email used for login.',
  })
  @IsEmail({}, { message: `EN: Email must be a valid email address. RU: Email должен быть корректным адресом. UZ: Email manzili to‘g‘ri bo‘lishi kerak.` })
  email!: string;

  @ApiProperty({
    example: 'Password123',
    minLength: 8,
    description: 'User account password.',
  })
  @IsString({ message: `EN: Password must be a string. RU: Пароль должен быть строкой. UZ: Parol matn ko‘rinishida bo‘lishi kerak.` })
  @MinLength(8, { message: `EN: Password must be at least 8 characters long. RU: Пароль должен содержать не менее 8 символов. UZ: Parol kamida 8 ta belgidan iborat bo‘lishi kerak.` })
  password!: string;
}
