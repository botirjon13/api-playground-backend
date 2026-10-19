import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReviewAdDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  approve!: boolean;

  @ApiProperty({ required: false, example: 'Rasm va havolani yangilang.' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  feedback?: string;
}
