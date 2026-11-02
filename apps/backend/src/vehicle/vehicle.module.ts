import {Module} from '@nestjs/common';

import {VehicleDeletionService} from './deletion/vehicle-deletion.service';
import {VehicleController} from './vehicle.controller';
import {VehicleService} from './vehicle.service';

@Module({
  controllers: [VehicleController],
  providers: [VehicleService, VehicleDeletionService],
  exports: [VehicleDeletionService],
})
export class VehicleModule {}
