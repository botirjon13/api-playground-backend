import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAdDto {
  @ApiProperty({ example: 'Yangi dasturlash bootcampi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'https://cdn.example.com/ad-banner.png' })
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  imageUrl!: string;

  @ApiProperty({ example: 'https://example.com/bootcamp' })
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  targetUrl!: string;

  @ApiProperty({ example: 14, minimum: 1, maximum: 365 })
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays!: number;
}
