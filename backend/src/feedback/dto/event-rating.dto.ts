import { ApiProperty } from '@nestjs/swagger';

export class EventRatingDto {
  @ApiProperty({ type: Number, nullable: true, description: 'Average rating across rating questions (1-5).' })
  average!: number | null;

  @ApiProperty({ type: Number, description: 'Number of rating answers counted.' })
  count!: number;
}
