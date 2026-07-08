import { Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
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

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Legacy root POST compatibility',
    description: 'Absorbs legacy POST probes to the root path without logging noisy 404s.',
  })
  rootPost(): { message: string } {
    return { message: 'Think Then Talk API is operational' };
  }

  @Get('favicon.ico')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Favicon compatibility',
    description: 'Returns an empty favicon response for browser probes.',
  })
  favicon(@Res() res: Response): void {
    res.status(204).end();
  }

  @Post('graphql')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Legacy GraphQL compatibility',
    description: 'Returns a clear response for clients still probing the retired GraphQL endpoint.',
  })
  graphqlCompatibility(): { message: string } {
    return { message: 'GraphQL is not enabled. Use the REST API under /api.' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Health check response', type: HealthCheckDto })
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
