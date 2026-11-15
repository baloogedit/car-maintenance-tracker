import {Module} from '@nestjs/common';

import {VehicleModule} from '../vehicle/vehicle.module';
import {SyncHandlerRegistry} from './handlers/sync-handler.registry';
import {VehicleSyncHandler} from './handlers/vehicle/vehicle-sync.handler';
import {SyncPullService} from './pull/sync-pull.service';
import {SyncPushService} from './push/sync-push.service';
import {SyncController} from './sync.controller';

// A VehicleModule a VehicleDeletionService miatt kell (push DELETE).
@Module({
  imports: [VehicleModule],
  controllers: [SyncController],
  providers: [SyncPushService, SyncPullService, SyncHandlerRegistry, VehicleSyncHandler],
})
export class SyncModule {}
