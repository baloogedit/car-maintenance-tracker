import {GoneException, Injectable} from '@nestjs/common';

import {
  SYNC_PULL_DEFAULT_LIMIT,
  SYNC_STATE_PURGED_VERSION,
} from '../../shared/constants/sync.constants';
import {SyncEntity} from '../../shared/enums/sync-entity.enum';
import {JwtPayload} from '../../shared/interfaces/jwt-payload.interface';
import {PrismaService} from '../../shared/modules/db/prisma.service';
import {buildPullPage, syncScopeOf} from '../../shared/policies/sync.policy';
import {SyncPullQueryDto} from '../dto/input/sync-pull-query.dto';
import {SyncChangesDto} from '../dto/output/sync-changes.dto';
import {SyncPullResponseDto} from '../dto/output/sync-pull-response.dto';
import {SyncPulledRow} from '../handlers/sync-entity-handler.interface';
import {SyncHandlerRegistry} from '../handlers/sync-handler.registry';

// GET /sync/pull?since=&limit=&scope=: a since ota valtozott, a felhasznalo
// altal lathato sorok (a tombstone-ok is).
//
// A kurzor a version (SQL Server rowversion): adatbazis szinten szigoruan
// novekvo, ezert egyetlen szam eleg az osszes tablara. A felso korlat a
// MIN_ACTIVE_ROWVERSION(): a meg nem commitolt tranzakciok sorai ennel nem
// kisebbek, igy a kurzor sosem lep at egy kesobb commitolo sort.
@Injectable()
export class SyncPullService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: SyncHandlerRegistry,
  ) {}

  async pull(user: JwtPayload, query: SyncPullQueryDto): Promise<SyncPullResponseDto> {
    const since = BigInt(query.since ?? 0);
    const limit = query.limit ?? SYNC_PULL_DEFAULT_LIMIT;
    const scope = syncScopeOf(user);
    const serverNow = new Date();

    await this.assertNotPurged(since);

    // Megvaltozott a lathatosagi kor (cegbe lepes / kilepes / eltavolitas): a
    // kliens dobja el a helyi adatot (a fuggo valtozasai kivetelevel), es since=0-rol huzzon.
    if (since > 0n && query.scope !== undefined && query.scope !== scope) {
      return {
        changes: groupByEntity([]),
        cursor: 0,
        hasMore: false,
        resetRequired: true,
        scope,
        serverNow,
      };
    }

    const upper = await this.minActiveRowversion();
    const range = {since, upper, take: limit + 1};
    const perTable = await Promise.all(
      this.registry.all().map((handler) => handler.pull(this.prisma, user, range)),
    );
    const page = buildPullPage(perTable, limit, since, upper);

    return {
      changes: groupByEntity(page.rows),
      cursor: Number(page.cursor),
      hasMore: page.hasMore,
      resetRequired: false,
      scope,
      serverNow,
    };
  }

  // A tombstone takaritas (90 nap) utan a regebbi kurzorral mar nem lehet
  // deltat adni, mert a fizikailag torolt sorok torlese nem jutna el a klienshez.
  private async assertNotPurged(since: bigint): Promise<void> {
    if (since === 0n) return;
    const state = await this.prisma.syncState.findUnique({
      where: {key: SYNC_STATE_PURGED_VERSION},
    });
    if (state && since < BigInt(state.value)) {
      throw new GoneException({
        statusCode: 410,
        code: 'SYNC_RESET_REQUIRED',
        message: 'A kurzor tul regi, teljes ujraszinkron kell (since=0).',
      });
    }
  }

  private async minActiveRowversion(): Promise<bigint> {
    const [row] = await this.prisma.$queryRaw<{upper: bigint}[]>`
      SELECT CAST(MIN_ACTIVE_ROWVERSION() AS bigint) AS upper`;
    return row.upper;
  }
}

function groupByEntity(rows: SyncPulledRow[]): SyncChangesDto {
  const changes: SyncChangesDto = {[SyncEntity.Vehicle]: []};
  for (const row of rows) {
    changes[row.entity].push(row.change);
  }
  return changes;
}
