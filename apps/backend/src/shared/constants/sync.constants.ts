import {SyncEntity} from '../enums/sync-entity.enum';

// Egy push kerdesben legfeljebb ennyi mutation lehet.
export const SYNC_PUSH_MAX_MUTATIONS = 100;

// A pull oldalmerete: alapertelmezes es felso korlat (sor, az osszes tablara egyutt).
export const SYNC_PULL_DEFAULT_LIMIT = 500;
export const SYNC_PULL_MAX_LIMIT = 1000;

// A push a mutationoket ebben a sorrendben dolgozza fel (szulo a gyerek elott),
// barmilyen sorrendben is kuldi oket a kliens. A pull is ebben a sorrendben
// adja a tablakat. Bovitesnel: Vehicle -> MaintenanceLog -> MaintenanceOperation
// -> FuelLog, Insurance, VehicleTax, VehicleEvent, ObdScan -> ObdErrorCode -> Attachment.
export const SYNC_ENTITY_ORDER: readonly SyncEntity[] = [SyncEntity.Vehicle];

// SyncState kulcs: a tombstone takaritas soran fizikailag torolt legnagyobb
// version. Ennel regebbi since-ra a pull 410-et ad (teljes ujraszinkron).
export const SYNC_STATE_PURGED_VERSION = 'purgedVersion';
