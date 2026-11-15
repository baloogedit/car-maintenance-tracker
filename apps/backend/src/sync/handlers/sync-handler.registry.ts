import {Injectable} from '@nestjs/common';

import {SYNC_ENTITY_ORDER} from '../../shared/constants/sync.constants';
import {SyncEntity} from '../../shared/enums/sync-entity.enum';
import {SyncEntityHandler} from './sync-entity-handler.interface';
import {VehicleSyncHandler} from './vehicle/vehicle-sync.handler';

// A tablankenti handlerek egy helyen. Uj szinkronizalt tabla: a handlert a
// konstruktorba injektald, es vedd fel a handlers listaba.
@Injectable()
export class SyncHandlerRegistry {
  private readonly handlers: ReadonlyMap<SyncEntity, SyncEntityHandler>;

  constructor(vehicle: VehicleSyncHandler) {
    const handlers: SyncEntityHandler[] = [vehicle];
    this.handlers = new Map(handlers.map((h) => [h.entity, h]));
  }

  get(entity: SyncEntity): SyncEntityHandler {
    const handler = this.handlers.get(entity);
    if (!handler) throw new Error(`Nincs szinkron handler: ${entity}`);
    return handler;
  }

  // A handlerek a SYNC_ENTITY_ORDER sorrendjeben (szulo a gyerek elott).
  all(): SyncEntityHandler[] {
    return SYNC_ENTITY_ORDER.map((entity) => this.get(entity));
  }
}
