import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class TrackAdEventDto {
  @ApiProperty({ enum: ['IMPRESSION', 'CLICK'] })
  @IsIn(['IMPRESSION', 'CLICK'])
  type!: 'IMPRESSION' | 'CLICK';
}
