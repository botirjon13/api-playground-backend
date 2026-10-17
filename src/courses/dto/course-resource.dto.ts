import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CourseResourceDto {
  @ApiProperty({ example: 'Mashq fayllari' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'https://drive.google.com/file/d/example/view' })
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url!: string;
}
