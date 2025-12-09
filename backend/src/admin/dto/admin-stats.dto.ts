import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsDto {
  @ApiProperty({ type: Number })
  upcomingEvents!: number;

  @ApiProperty({ type: Number })
  totalRegistrations!: number;

  @ApiProperty({ type: Number })
  paidRegistrations!: number;

  @ApiProperty({ type: Number })
  totalRevenue!: number;
}
