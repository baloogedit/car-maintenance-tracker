// A /sync/push es /sync/pull szerzodese (lasd: API es szinkronizacios terv).

export type SyncEntity = 'Vehicle';
export type SyncOp = 'UPSERT' | 'DELETE';

// ---------- push ----------

export interface PushMutation {
  mutationId: string;
  entity: SyncEntity;
  op: SyncOp;
  id: string;
  baseVersion: number | null;
  clientUpdatedAt: string;
  data?: Record<string, unknown>;
}

export interface PushRequest {
  deviceId: string;
  clientNow: string;
  mutations: PushMutation[];
}

export type PushStatus =
  'APPLIED' | 'DUPLICATE' | 'REJECTED_STALE' | 'REJECTED_INVALID' | 'DEFERRED';

// A szerveren levo valtozat (REJECTED_STALE-nel es a pullban).
// Tombstone (torolt sor) eseten nincs data: {id, version, clientUpdatedAt, deletedAt}.
export interface ServerRow {
  id: string;
  version: number;
  clientUpdatedAt: string;
  deletedAt: string | null;
  data?: Record<string, unknown>;
}

export type SyncErrorCode =
  'VALIDATION_FAILED' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'MUTATION_ID_CONFLICT';

export interface SyncError {
  code: SyncErrorCode;
  message: string;
}

// Az eredmenyeket mutationId alapjan parositjuk (a szerver mas sorrendben dolgozhat).
// DUPLICATE: mar feldolgozott mutation; az originalStatus es a tobbi mezo az eredeti eredmeny.
export interface PushResult {
  mutationId: string;
  status: PushStatus;
  originalStatus?: PushStatus;
  version?: number | null;
  error?: SyncError;
  current?: ServerRow;
}

export interface PushResponse {
  serverNow: string;
  results: PushResult[];
}

// ---------- pull ----------

// scope: mit lat a felhasznalo (sajat / ceges kor). Elmentjuk, es a kovetkezo pullnal
// visszakuldjuk; ha azota megvaltozott (cegbe lepes, kilepes), resetRequired: true jon.
export interface PullResponse {
  changes: Record<SyncEntity, ServerRow[]>;
  cursor: number;
  hasMore: boolean;
  resetRequired: boolean;
  scope: string;
  serverNow: string;
}

// A szerver Vehicle sorai a pullban (ServerRow.data).
export interface VehicleSyncData {
  ownerUserId: string;
  companyId: string | null;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  licensePlate: string | null;
  engineType: string | null;
  fuelType: string;
  currentMileage: number;
  purchaseDate: string | null;
  createdAt: string;
}
