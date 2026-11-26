import {ApiError} from '@/api/apiClient';
import {syncApi} from '@/api/syncApi';
import {getDb, writeTransaction} from '@/db/database';
import {
  countByStatus,
  markFailed,
  type OutboxEntry,
  releaseInFlight,
  removeEntry,
  takeBatch,
} from '@/db/repositories/outboxRepository';
import {getSyncState, setSyncState} from '@/db/repositories/syncStateRepository';
import {
  applyServerVehicle,
  clearSyncedVehicles,
  markVehicleSynced,
} from '@/db/repositories/vehicleRepository';
import {useSyncStore} from '@/store/useSyncStore';
import type {PushResult, ServerRow, SyncEntity} from '@/types/sync.types';
import {getDeviceId} from '@/utils/deviceId';
import {errorMessage} from '@/utils/errorMessage';

// A szinkron motor. Egy kor: eloszor PUSH (a helyi valtozasok fel), utana PULL (a
// szerver valtozasai le), igy a pull mar a sajat irasainkat is tartalmazza.
// Egyszerre csak egy kor fut; ha kozben ujabb keres jon, a kor vegen meg egyszer lefut.

const PUSH_BATCH_SIZE = 100;
const PULL_LIMIT = 500;
const LOCAL_WRITE_DEBOUNCE_MS = 3000;

// Entitasonkent: hogyan kerul a szerver sora a helyi tablaba, es hogyan jelolunk
// szinkronizaltnak egy sort. Uj entitas (pl. FuelLog) = uj sor ezekben a tablakban.
const APPLY_SERVER_ROW: Record<SyncEntity, typeof applyServerVehicle> = {
  Vehicle: applyServerVehicle,
};
const MARK_SYNCED: Record<SyncEntity, typeof markVehicleSynced> = {
  Vehicle: markVehicleSynced,
};
// a szulo elobb menjen fel, mint a gyerek (Vehicle -> FuelLog -> ...)
const ENTITY_ORDER: SyncEntity[] = ['Vehicle'];

let running = false;
let runAgain = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Szinkron inditasa (app elotérbe kerul, visszajott a halozat, lehuzas a listan).
export async function runSync(): Promise<void> {
  if (running) {
    runAgain = true;
    return;
  }
  running = true;
  const store = useSyncStore.getState();
  try {
    do {
      runAgain = false;
      store.setStatus('syncing');
      await pushChanges();
      await pullChanges();
      const now = new Date().toISOString();
      await writeTransaction((db) => setSyncState(db, 'lastSyncAt', now));
      store.setLastSyncAt(now);
      store.setStatus('synced');
    } while (runAgain);
  } catch (error) {
    // halozati hiba (status 0) = offline; minden mas hiba
    const offline = error instanceof ApiError && error.status === 0;
    store.setStatus(offline ? 'offline' : 'error', offline ? null : errorMessage(error));
  } finally {
    running = false;
    await refreshCounts();
  }
}

// Helyi iras utan: a listak frissulnek, es 3 mp mulva (ha nem jon ujabb iras) szinkron.
export function notifyLocalChange(): void {
  useSyncStore.getState().bumpDataVersion();
  void refreshCounts();
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runSync();
  }, LOCAL_WRITE_DEBOUNCE_MS);
}

export async function refreshCounts(): Promise<void> {
  if (!useSyncStore.getState().dbReady) {
    return;
  }
  const {pending, failed} = await countByStatus(getDb());
  useSyncStore.getState().setCounts(pending, failed);
}

// Teljes ujraszinkron elokeszitese (410 vagy resetRequired): a szinkronizalt
// sorok torlodnek, a kurzor 0-ra all. A fel nem kuldott valtozasok megmaradnak.
export async function resetLocalSyncData(): Promise<void> {
  await writeTransaction(async (db) => {
    await clearSyncedVehicles(db);
    await setSyncState(db, 'lastPulledVersion', '0');
  });
  useSyncStore.getState().bumpDataVersion();
}

// ---------- push ----------

async function pushChanges(): Promise<void> {
  const deviceId = await getDeviceId();
  for (;;) {
    const batch = sortByEntity(await writeTransaction((db) => takeBatch(db, PUSH_BATCH_SIZE)));
    if (batch.length === 0) {
      return;
    }
    let response;
    try {
      response = await syncApi.push({
        deviceId,
        clientNow: new Date().toISOString(),
        mutations: batch.map((entry) => ({
          mutationId: entry.mutationId,
          entity: entry.entity,
          op: entry.op,
          id: entry.entityId,
          baseVersion: entry.baseVersion,
          clientUpdatedAt: entry.clientUpdatedAt,
          data: entry.payload ? (JSON.parse(entry.payload) as Record<string, unknown>) : undefined,
        })),
      });
    } catch (error) {
      // valasz nelkul nem tudjuk, mi ment at: vissza PENDING-be. Ha megis atment, a
      // szerver a mutationId alapjan felismeri (DUPLICATE).
      await writeTransaction((db) => releaseInFlight(db));
      throw error;
    }

    let deferred = 0;
    await writeTransaction(async (db) => {
      for (const result of response.results) {
        const entry = batch.find((e) => e.mutationId === result.mutationId);
        if (entry) {
          deferred += (await applyPushResult(entry, result)) ? 0 : 1;
        }
      }
    });
    useSyncStore.getState().bumpDataVersion();
    // ha minden csak DEFERRED lett, ebben a korben nincs ertelme ujrakuldeni
    if (deferred === batch.length) {
      return;
    }
  }
}

// Egy mutation eredmenyenek feldolgozasa. false = DEFERRED (kesobb ujra).
async function applyPushResult(entry: OutboxEntry, result: PushResult): Promise<boolean> {
  const db = getDb();
  switch (result.status) {
    case 'DUPLICATE':
      // mar feldolgozta a szerver (pl. elveszett a valasz): az eredeti eredmeny szamit
      return applyPushResult(entry, {...result, status: result.originalStatus ?? 'APPLIED'});
    case 'APPLIED':
      await removeEntry(db, entry.mutationId);
      if (result.version != null) {
        await MARK_SYNCED[entry.entity](db, entry.entityId, result.version);
      }
      return true;
    case 'REJECTED_STALE':
      // a szerver valtozata ujabb (LWW): az felulirja a helyit
      await removeEntry(db, entry.mutationId);
      if (result.current) {
        await APPLY_SERVER_ROW[entry.entity](db, result.current);
      }
      return true;
    case 'REJECTED_INVALID':
      // nem probaljuk ujra magatol; a felhasznalo latja a Profil > Szinkron kartyan
      await markFailed(db, entry.mutationId, result.error?.message ?? 'A szerver elutasította.');
      return true;
    case 'DEFERRED':
      await releaseInFlight(db, entry.mutationId);
      return false;
  }
}

function sortByEntity(entries: OutboxEntry[]): OutboxEntry[] {
  return [...entries].sort(
    (a, b) => ENTITY_ORDER.indexOf(a.entity) - ENTITY_ORDER.indexOf(b.entity),
  );
}

// ---------- pull ----------

async function pullChanges(): Promise<void> {
  let resetDone = false;
  for (;;) {
    const since = Number((await getSyncState(getDb(), 'lastPulledVersion')) ?? '0');
    const scope = await getSyncState(getDb(), 'scope');
    let page;
    try {
      page = await syncApi.pull(since, PULL_LIMIT, scope);
    } catch (error) {
      // 410: a kurzorunk regebbi, mint amit a szerver meg ismer -> teljes ujraszinkron
      if (error instanceof ApiError && error.status === 410 && !resetDone) {
        resetDone = true;
        await resetLocalSyncData();
        continue;
      }
      throw error;
    }
    // megvaltozott, mit latunk (cegbe lepes, kilepes, eltavolitas): a regi szinkronizalt
    // adat eldobva, az uj scope-pal 0-rol ujra
    if (page.resetRequired) {
      if (resetDone) {
        throw new Error('A szerver ismételten teljes újraszinkront kér.');
      }
      resetDone = true;
      await resetLocalSyncData();
      await writeTransaction((db) => setSyncState(db, 'scope', page.scope));
      continue;
    }

    // az oldal minden sora + az uj kurzor EGY tranzakcioban: vagy minden beirodik, vagy semmi
    await writeTransaction(async (db) => {
      for (const entity of ENTITY_ORDER) {
        const rows: ServerRow[] = page.changes[entity] ?? [];
        for (const row of rows) {
          await APPLY_SERVER_ROW[entity](db, row);
        }
      }
      await setSyncState(db, 'lastPulledVersion', String(page.cursor));
      await setSyncState(db, 'scope', page.scope);
    });
    useSyncStore.getState().bumpDataVersion();

    if (!page.hasMore) {
      return;
    }
  }
}
