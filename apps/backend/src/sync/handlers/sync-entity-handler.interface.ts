import {Prisma} from '@prisma/client';

import {SyncEntity} from '../../shared/enums/sync-entity.enum';
import {SyncErrorCode} from '../../shared/enums/sync-error-code.enum';
import {JwtPayload} from '../../shared/interfaces/jwt-payload.interface';
import {StoredRow} from '../../shared/policies/sync.policy';
import {SyncChangeDto} from '../dto/output/sync-change.dto';
import {SyncMutationResultDto} from '../dto/output/sync-mutation-result.dto';

// Prisma kliens vagy egy tranzakcio kliense: a handler mindkettovel mukodik.
export type SyncDb = Prisma.TransactionClient;

// Egy push iras korulmenyei.
export interface SyncWriteContext {
  user: JwtPayload;
  deviceId: string;
  effectiveUpdatedAt: Date; // az orajavitott clientUpdatedAt: ez kerul a sorba
}

// A szerveren mar letezo sor allapota (a torolt is) az LWW donteshez.
export interface ExistingSyncRow extends StoredRow {
  deletedAt: Date | null;
  // a jogosultsagi dontes eredmenye: null = a felhasznalo irhatja
  denied: SyncErrorCode.NOT_FOUND | SyncErrorCode.FORBIDDEN | null;
}

// A pull tartomanya: since < version < upper, legfeljebb take sor.
export interface SyncPullRange {
  since: bigint;
  upper: bigint;
  take: number;
}

// Egy pull altal visszaadott sor: a version bigint-kent is megvan az osszefesuleshez.
export interface SyncPulledRow {
  entity: SyncEntity;
  version: bigint;
  change: SyncChangeDto;
}

// A beszuras elotti ellenorzes elutasito eredmenye (pl. FuelLog-nal: DEFERRED,
// ha a szulo jarmu meg nincs a szerveren).
export type SyncInsertRejection = Omit<SyncMutationResultDto, 'mutationId'>;

// Egy szinkronizalt tabla minden tablafuggo resze. A kozos dontesi folyamat
// (idempotencia, LWW, tombstone) a SyncPushService-ben van; uj tabla = uj handler,
// amit a SyncHandlerRegistry-ben kell felvenni.
export interface SyncEntityHandler<TData = unknown> {
  readonly entity: SyncEntity;

  // A mutation data mezojenek validalasa; hibanal a hibauzenet.
  parseData(data: Record<string, unknown>): Promise<{value: TData} | {error: string}>;

  // A sor betoltese id alapjan (torolt is), jogosultsagi dontessel. null = nincs ilyen sor.
  findExisting(db: SyncDb, user: JwtPayload, id: string): Promise<ExistingSyncRow | null>;

  // Uj sor beszurasa elotti ellenorzes. null = mehet.
  checkInsert(db: SyncDb, user: JwtPayload, data: TData): Promise<SyncInsertRejection | null>;

  insert(db: SyncDb, ctx: SyncWriteContext, id: string, data: TData): Promise<void>;
  update(db: SyncDb, ctx: SyncWriteContext, id: string, data: TData): Promise<void>;
  softDelete(db: SyncDb, ctx: SyncWriteContext, id: string): Promise<void>;

  // A sor aktualis szerver peldanya (push valaszhoz: version, current).
  findChange(db: SyncDb, id: string): Promise<SyncChangeDto | null>;

  // A felhasznalo altal lathato, a tartomanyba eso sorok version szerint novekvoen.
  pull(db: SyncDb, user: JwtPayload, range: SyncPullRange): Promise<SyncPulledRow[]>;
}
