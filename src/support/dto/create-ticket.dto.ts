import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ enum: TicketCategory, example: TicketCategory.TECHNICAL_ISSUE })
  @IsEnum(TicketCategory)
  category!: TicketCategory;

  @ApiProperty({ example: 'Kurs sahifasida xatolik', minLength: 5, maxLength: 120 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  subject!: string;

  @ApiProperty({ example: 'Muammo qaysi sahifada va qanday yuz berganini tushuntiring.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/\S/)
  @MinLength(10)
  @MaxLength(10000)
  message!: string;

  @ApiPropertyOptional({ example: 'Backend dasturlash' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  instructorSpecialty?: string;

  @ApiPropertyOptional({ example: '3 yil backend ishlab chiqish tajribasi' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  instructorExperience?: string;

  @ApiPropertyOptional({ example: 'https://github.com/example' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  instructorPortfolio?: string;

  @ApiPropertyOptional({ example: 'REST API xavfsizligi bo‘yicha amaliy kurs' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  instructorCourseIdea?: string;
}
