import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, Max, Min } from 'class-validator';

export class SubmitFinalTestDto {
  @ApiProperty({ example: [0, 3, 1] })
  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(3, { each: true })
  answers!: number[];
}
