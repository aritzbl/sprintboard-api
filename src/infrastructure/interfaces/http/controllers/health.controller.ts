import { Controller, Get } from '@nestjs/common';
import { Public } from '@interfaces/http/middlewares/auth/roles.decorator';

/** Public liveness probe used by the hosting platform. */
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
