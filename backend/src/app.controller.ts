import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Backend root',
    description: 'Returns a basic status message to confirm the server is reachable.',
  })
  root(): string {
    return 'Think Then Talk API is operational';
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Health check response', type: HealthCheckDto })
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
