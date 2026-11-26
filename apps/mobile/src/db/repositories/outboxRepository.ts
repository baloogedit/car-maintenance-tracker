import {randomUUID} from 'expo-crypto';
import type {SQLiteDatabase} from 'expo-sqlite';

import type {SyncEntity, SyncOp} from '@/types/sync.types';

// Az outbox: a meg fel nem kuldott helyi valtozasok sora. Minden helyi iras UGYANABBAN
// a tranzakcioban kap egy outbox bejegyzest, igy adat es szinkronigeny nem valhat el.

export type OutboxStatus = 'PENDING' | 'IN_FLIGHT' | 'FAILED';

export interface OutboxEntry {
  mutationId: string;
  entity: SyncEntity;
  entityId: string;
  op: SyncOp;
  baseVersion: number | null;
  clientUpdatedAt: string;
  payload: string | null;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
}

interface EnqueueParams {
  entity: SyncEntity;
  entityId: string;
  op: SyncOp;
  baseVersion: number | null;
  clientUpdatedAt: string;
  payload: Record<string, unknown> | null;
}

// Uj bejegyzes, osszevonassal (coalescing): egy sorhoz egyszerre csak egy varakozo
// bejegyzes tartozik, a kesobbi iras ezt frissiti. Visszaadja, ha a valtozas "eltunt":
// uj, meg sosem kuldott sort toroltunk, amirol a szerver nem is tud.
export async function enqueue(
  db: SQLiteDatabase,
  params: EnqueueParams,
): Promise<'queued' | 'dropped'> {
  const {entity, entityId, op, baseVersion, clientUpdatedAt} = params;
  const payload = params.payload ? JSON.stringify(params.payload) : null;

  const existing = await db.getFirstAsync<OutboxEntry>(
    "SELECT * FROM outbox WHERE entity = ? AND entityId = ? AND status <> 'IN_FLIGHT'",
    entity,
    entityId,
  );
  const inFlight = await db.getFirstAsync<{mutationId: string}>(
    "SELECT mutationId FROM outbox WHERE entity = ? AND entityId = ? AND status = 'IN_FLIGHT'",
    entity,
    entityId,
  );

  if (!existing) {
    await db.runAsync(
      `INSERT INTO outbox (mutationId, entity, entityId, op, baseVersion, clientUpdatedAt, payload, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      randomUUID(),
      entity,
      entityId,
      op,
      baseVersion,
      clientUpdatedAt,
      payload,
      new Date().toISOString(),
    );
    return 'queued';
  }

  // UPSERT utan torles, es a sor meg sosem ment fel (es most sem megy): mindketto torolheto
  if (op === 'DELETE' && existing.baseVersion === null && !inFlight) {
    await db.runAsync('DELETE FROM outbox WHERE mutationId = ?', existing.mutationId);
    return 'dropped';
  }

  // a meglevo bejegyzes frissul; a baseVersion marad (abbol a verziobol indult a valtozas).
  // Uj mutationId kell, mert ez mar mas tartalom (a regit a szerver esetleg mar latta).
  await db.runAsync(
    `UPDATE outbox SET mutationId = ?, op = ?, payload = ?, clientUpdatedAt = ?,
       status = 'PENDING', attempts = 0, lastError = NULL
     WHERE mutationId = ?`,
    randomUUID(),
    op,
    payload,
    clientUpdatedAt,
    existing.mutationId,
  );
  return 'queued';
}

// A kovetkezo kuldendo csomag: legfeljebb `limit` PENDING bejegyzes, IN_FLIGHT-ra allitva.
export async function takeBatch(db: SQLiteDatabase, limit: number): Promise<OutboxEntry[]> {
  const entries = await db.getAllAsync<OutboxEntry>(
    "SELECT * FROM outbox WHERE status = 'PENDING' ORDER BY createdAt LIMIT ?",
    limit,
  );
  for (const entry of entries) {
    await db.runAsync(
      "UPDATE outbox SET status = 'IN_FLIGHT', attempts = attempts + 1 WHERE mutationId = ?",
      entry.mutationId,
    );
  }
  return entries;
}

// IN_FLIGHT -> PENDING (halozati hiba, DEFERRED, vagy app inditas egy megszakadt kor utan).
// Ha kozben uj iras jott ugyanarra a sorra, az a frissebb (teljes sort tartalmaz), ezert
// a regi, kuldes alatti bejegyzest eldobjuk.
export async function releaseInFlight(db: SQLiteDatabase, mutationId?: string): Promise<void> {
  const entries = mutationId
    ? await db.getAllAsync<OutboxEntry>('SELECT * FROM outbox WHERE mutationId = ?', mutationId)
    : await db.getAllAsync<OutboxEntry>("SELECT * FROM outbox WHERE status = 'IN_FLIGHT'");
  for (const entry of entries) {
    const newer = await db.getFirstAsync<{mutationId: string}>(
      "SELECT mutationId FROM outbox WHERE entity = ? AND entityId = ? AND status <> 'IN_FLIGHT'",
      entry.entity,
      entry.entityId,
    );
    if (newer) {
      await db.runAsync('DELETE FROM outbox WHERE mutationId = ?', entry.mutationId);
    } else {
      await db.runAsync(
        "UPDATE outbox SET status = 'PENDING' WHERE mutationId = ?",
        entry.mutationId,
      );
    }
  }
}

export async function removeEntry(db: SQLiteDatabase, mutationId: string): Promise<void> {
  await db.runAsync('DELETE FROM outbox WHERE mutationId = ?', mutationId);
}

export async function markFailed(
  db: SQLiteDatabase,
  mutationId: string,
  error: string,
): Promise<void> {
  await db.runAsync(
    "UPDATE outbox SET status = 'FAILED', lastError = ? WHERE mutationId = ?",
    error,
    mutationId,
  );
}

// A hibas (FAILED) bejegyzesek ujra kuldesre jeloleses (felhasznaloi "ujraprobalas").
export async function retryFailed(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    "UPDATE outbox SET status = 'PENDING', attempts = 0, lastError = NULL WHERE status = 'FAILED'",
  );
}

export async function hasEntryFor(
  db: SQLiteDatabase,
  entity: SyncEntity,
  entityId: string,
): Promise<boolean> {
  const row = await db.getFirstAsync<{n: number}>(
    'SELECT COUNT(*) AS n FROM outbox WHERE entity = ? AND entityId = ?',
    entity,
    entityId,
  );
  return (row?.n ?? 0) > 0;
}

export async function countByStatus(
  db: SQLiteDatabase,
): Promise<{pending: number; failed: number}> {
  const row = await db.getFirstAsync<{pending: number; failed: number}>(
    `SELECT
       COALESCE(SUM(CASE WHEN status <> 'FAILED' THEN 1 ELSE 0 END), 0) AS pending,
       COALESCE(SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END), 0) AS failed
     FROM outbox`,
  );
  return {pending: row?.pending ?? 0, failed: row?.failed ?? 0};
}
