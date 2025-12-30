import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModuleStatusDto {
  @ApiProperty({ enum: ['ok', 'degraded', 'down'] })
  status!: 'ok' | 'degraded' | 'down';

  @ApiProperty({ type: String })
  module!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp!: string;

  @ApiPropertyOptional({
    description: 'Additional status details',
    type: Object,
  })
  details?: Record<string, any>;
}
