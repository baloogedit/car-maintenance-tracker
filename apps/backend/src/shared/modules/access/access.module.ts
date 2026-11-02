import {Module} from '@nestjs/common';

import {VehicleAccessGuard} from '../../guards/vehicle-access.guard';
import {AccessService} from './access.service';

@Module({
  providers: [AccessService, VehicleAccessGuard],
  exports: [AccessService, VehicleAccessGuard],
})
export class AccessModule {}
