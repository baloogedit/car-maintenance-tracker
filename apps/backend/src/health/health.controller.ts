import {Controller, Get} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';

import {Public} from '../shared/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  // Egyszeru elerhetoseg-ellenorzes (pl. a mobil app ezzel nezi, van-e szerver).
  @Public()
  @Get()
  check() {
    return {status: 'ok'};
  }
}
