import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateTicketMessageDto {
  @ApiProperty({ example: 'Muammoning tafsilotlarini tekshirib chiqdim...' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/\S/)
  @MinLength(2)
  @MaxLength(10000)
  body!: string;
}
