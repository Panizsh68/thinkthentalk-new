import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { HealthResponse } from './app.service';

class HealthCheckDto implements HealthResponse {
  @ApiProperty({ example: 'ok', description: 'Overall service status' })
  status!: 'ok';

  @ApiProperty({ example: 123, description: 'Process uptime in seconds' })
  uptime!: number;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Timestamp when the check was produced',
  })
  timestamp!: string;
}

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOkResponse({ description: 'Health check', type: HealthCheckDto })
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
