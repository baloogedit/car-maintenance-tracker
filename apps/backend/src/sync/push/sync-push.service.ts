import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';

import {SYNC_ENTITY_ORDER} from '../../shared/constants/sync.constants';
import {SyncErrorCode} from '../../shared/enums/sync-error-code.enum';
import {SyncMutationStatus} from '../../shared/enums/sync-mutation-status.enum';
import {SyncOperation} from '../../shared/enums/sync-operation.enum';
import {JwtPayload} from '../../shared/interfaces/jwt-payload.interface';
import {PrismaService} from '../../shared/modules/db/prisma.service';
import {effectiveClientTime, incomingWins} from '../../shared/policies/sync.policy';
import {SyncMutationDto} from '../dto/input/sync-mutation.dto';
import {SyncPushRequestDto} from '../dto/input/sync-push-request.dto';
import {SyncMutationResultDto} from '../dto/output/sync-mutation-result.dto';
import {SyncPushResponseDto} from '../dto/output/sync-push-response.dto';
import {
  SyncDb,
  SyncEntityHandler,
  SyncWriteContext,
} from '../handlers/sync-entity-handler.interface';
import {SyncHandlerRegistry} from '../handlers/sync-handler.registry';

// Az eredmeny a mutationId nelkul (azt a vegen tesszuk ra).
type Outcome = Omit<SyncMutationResultDto, 'mutationId'>;

// POST /sync/push: a kliens outbox bejegyzeseinek feldolgozasa.
//
// Minden mutation SAJAT tranzakcioban fut (az iras + a SyncMutation sor egyutt),
// egymas utan, szulo-gyerek sorrendben. Igy egy hibas sor nem gorgeti vissza a
// tobbit, es az idempotencia is atomi: ha az iras megtortent, a mutationId is el
// van mentve. (A terv egy tranzakciot + mutationonkenti savepointot irt; az
// eredmeny ugyanaz, de a Prisma a savepointot nem tamogatja kozvetlenul.)
//
// Dontesi sorrend mutationonkent:
//   1. a mutationId mar szerepel (SyncMutation)  -> DUPLICATE, az eredeti eredmennyel
//   2. hibas data                                 -> REJECTED_INVALID (VALIDATION_FAILED)
//   3. a sor nem letezik: DELETE                  -> APPLIED (nincs mit torolni)
//                         UPSERT                  -> beszuras (vagy a handler elutasitja: DEFERRED / ...)
//   4. a sor letezik, de nem lathato / nem irhato -> REJECTED_INVALID (NOT_FOUND / FORBIDDEN)
//   5. a sor torolt (tombstone)                   -> REJECTED_STALE: torolt sor nem tamad fel,
//                                                   mert a kaszkadban torolt gyerekei sem jonnenek vissza
//   6. LWW (sync.policy.ts incomingWins)          -> APPLIED vagy REJECTED_STALE (current = szerver peldanya)
//   7. az eredmeny mentese a SyncMutation tablaba (a DEFERRED kivetelevel, azt a kliens ujrakuldi)
@Injectable()
export class SyncPushService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: SyncHandlerRegistry,
  ) {}

  async push(user: JwtPayload, dto: SyncPushRequestDto): Promise<SyncPushResponseDto> {
    const serverNow = new Date();
    const results: SyncMutationResultDto[] = [];
    for (const mutation of sortByEntityOrder(dto.mutations)) {
      const outcome = await this.processMutation(user, dto, mutation, serverNow);
      results.push({mutationId: mutation.mutationId, ...outcome});
    }
    return {serverNow, results};
  }

  private async processMutation(
    user: JwtPayload,
    dto: SyncPushRequestDto,
    mutation: SyncMutationDto,
    serverNow: Date,
  ): Promise<Outcome> {
    const duplicate = await this.findDuplicate(user, mutation);
    if (duplicate) return duplicate;

    const handler = this.registry.get(mutation.entity);
    let data: unknown = undefined;
    if (mutation.op === SyncOperation.UPSERT) {
      const parsed = await handler.parseData(mutation.data ?? {});
      if ('error' in parsed) {
        return this.saveOutcome(
          user,
          dto,
          mutation,
          invalid(SyncErrorCode.VALIDATION_FAILED, parsed.error),
        );
      }
      data = parsed.value;
    }

    const ctx: SyncWriteContext = {
      user,
      deviceId: dto.deviceId,
      effectiveUpdatedAt: effectiveClientTime(mutation.clientUpdatedAt, dto.clientNow, serverNow),
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const outcome = await this.decide(tx, handler, ctx, mutation, data);
        if (outcome.status !== SyncMutationStatus.DEFERRED) {
          await this.storeOutcome(tx, user, dto, mutation, outcome);
        }
        return outcome;
      });
    } catch (error) {
      // pl. foglalt VIN: a tranzakcio visszagordult, az elutasitast kulon mentjuk
      const rejected = toRejection(error);
      if (!rejected) throw error;
      return this.saveOutcome(user, dto, mutation, rejected);
    }
  }

  private async decide(
    tx: SyncDb,
    handler: SyncEntityHandler,
    ctx: SyncWriteContext,
    mutation: SyncMutationDto,
    data: unknown,
  ): Promise<Outcome> {
    const existing = await handler.findExisting(tx, ctx.user, mutation.id);

    if (!existing) {
      if (mutation.op === SyncOperation.DELETE) {
        return {status: SyncMutationStatus.APPLIED, version: null};
      }
      const rejection = await handler.checkInsert(tx, ctx.user, data);
      if (rejection) return rejection;
      await handler.insert(tx, ctx, mutation.id, data);
      return this.applied(tx, handler, mutation.id);
    }

    if (existing.denied === SyncErrorCode.NOT_FOUND) {
      return invalid(SyncErrorCode.NOT_FOUND, 'A sor nem talalhato.');
    }
    if (existing.denied === SyncErrorCode.FORBIDDEN) {
      return invalid(SyncErrorCode.FORBIDDEN, 'Ezt a sort nem modosithatod.');
    }

    const wins =
      existing.deletedAt === null &&
      incomingWins(
        {
          baseVersion: mutation.baseVersion == null ? null : BigInt(mutation.baseVersion),
          effectiveUpdatedAt: ctx.effectiveUpdatedAt,
          deviceId: ctx.deviceId,
        },
        existing,
      );
    if (!wins) {
      const current = await handler.findChange(tx, mutation.id);
      return {status: SyncMutationStatus.REJECTED_STALE, ...(current ? {current} : {})};
    }

    if (mutation.op === SyncOperation.DELETE) {
      await handler.softDelete(tx, ctx, mutation.id);
    } else {
      await handler.update(tx, ctx, mutation.id, data);
    }
    return this.applied(tx, handler, mutation.id);
  }

  private async applied(tx: SyncDb, handler: SyncEntityHandler, id: string): Promise<Outcome> {
    const change = await handler.findChange(tx, id);
    return {status: SyncMutationStatus.APPLIED, version: change?.version ?? null};
  }

  private async findDuplicate(
    user: JwtPayload,
    mutation: SyncMutationDto,
  ): Promise<Outcome | null> {
    const stored = await this.prisma.syncMutation.findUnique({
      where: {mutationId: mutation.mutationId},
    });
    if (!stored) return null;
    if (stored.userId !== user.sub) {
      return invalid(SyncErrorCode.MUTATION_ID_CONFLICT, 'Ez a mutationId mar foglalt.');
    }
    const original = JSON.parse(stored.result) as Outcome;
    return {...original, status: SyncMutationStatus.DUPLICATE, originalStatus: original.status};
  }

  private async saveOutcome(
    user: JwtPayload,
    dto: SyncPushRequestDto,
    mutation: SyncMutationDto,
    outcome: Outcome,
  ): Promise<Outcome> {
    await this.storeOutcome(this.prisma, user, dto, mutation, outcome);
    return outcome;
  }

  private async storeOutcome(
    db: SyncDb,
    user: JwtPayload,
    dto: SyncPushRequestDto,
    mutation: SyncMutationDto,
    outcome: Outcome,
  ): Promise<void> {
    await db.syncMutation.create({
      data: {
        mutationId: mutation.mutationId,
        userId: user.sub,
        deviceId: dto.deviceId,
        entity: mutation.entity,
        entityId: mutation.id,
        result: JSON.stringify(outcome),
      },
    });
  }
}

function invalid(code: SyncErrorCode, message: string): Outcome {
  return {status: SyncMutationStatus.REJECTED_INVALID, error: {code, message}};
}

// A Prisma adatbazis-hibak kozul azok, amik a kliens adatabol erednek.
function toRejection(error: unknown): Outcome | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (error.code === 'P2002') return invalid(SyncErrorCode.CONFLICT, 'Ez az ertek mar foglalt.');
  if (error.code === 'P2003') {
    return invalid(SyncErrorCode.VALIDATION_FAILED, 'Ervenytelen hivatkozas (idegen kulcs).');
  }
  return null;
}

// Stabil rendezes a SYNC_ENTITY_ORDER szerint: tablan belul a kliens sorrendje marad.
function sortByEntityOrder(mutations: SyncMutationDto[]): SyncMutationDto[] {
  return mutations
    .map((mutation, index) => ({mutation, index, rank: SYNC_ENTITY_ORDER.indexOf(mutation.entity)}))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({mutation}) => mutation);
}
