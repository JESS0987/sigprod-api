import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Module } from '@nestjs/common';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check del sistema SIGPROD' })
  check() {
    return {
      status: 'ok',
      system: 'SIGPROD',
      company: 'TechSoft Solutions S.A.S.',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
