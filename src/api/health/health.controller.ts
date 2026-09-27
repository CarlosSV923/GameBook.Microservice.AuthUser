import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'getAuthUserHealth',
    summary: 'Check AuthUser readiness',
  })
  @ApiResponse({ status: 200, description: 'AuthUser is ready.' })
  getHealth() {
    return { status: 'ok' };
  }
}
