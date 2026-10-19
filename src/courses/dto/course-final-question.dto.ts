import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CourseFinalQuestionDto {
  @ApiProperty({ example: 'HTTP 200 status kodi nimani bildiradi?' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  prompt!: string;

  @ApiProperty({ example: 'So‘rov muvaffaqiyatli bajarildi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  optionA!: string;

  @ApiProperty({ example: 'Foydalanuvchi topilmadi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  optionB!: string;

  @ApiProperty({ example: 'Serverda xatolik yuz berdi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  optionC!: string;

  @ApiProperty({ example: 'Kirish talab qilinadi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  optionD!: string;

  @ApiProperty({ example: 0, minimum: 0, maximum: 3 })
  @IsInt()
  @Min(0)
  @Max(3)
  correctOption!: number;
}
