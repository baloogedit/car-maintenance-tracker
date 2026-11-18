import type {SQLiteDatabase} from 'expo-sqlite';

// A helyi SQLite sema verziozott migraciokkal. Az adatbazis a PRAGMA user_version-ben
// tarolja, hanyadik migracio fut le utoljara; inditaskor csak az ujabbak futnak le.
// Uj tabla (pl. fuel_log) = uj elem a tomb VEGERE; a mar kiadottakat nem modositjuk.
const MIGRATIONS: string[] = [
  // 1: jarmu + outbox + szinkron allapot
  `
  CREATE TABLE vehicle (
    id              TEXT PRIMARY KEY NOT NULL,  -- UUID, a telefon generalja
    ownerUserId     TEXT NOT NULL,
    companyId       TEXT,
    make            TEXT NOT NULL,
    model           TEXT NOT NULL,
    year            INTEGER NOT NULL,
    vin             TEXT,
    licensePlate    TEXT,
    engineType      TEXT,
    fuelType        TEXT NOT NULL,
    currentMileage  INTEGER NOT NULL DEFAULT 0,
    purchaseDate    TEXT,
    createdAt       TEXT NOT NULL,
    -- szinkron mezok
    clientUpdatedAt TEXT NOT NULL,              -- utolso helyi modositas (LWW)
    version         INTEGER,                    -- utolso ismert szerver verzio; NULL = meg nincs a szerveren
    deletedAt       TEXT,                       -- tombstone; NULL = el
    synced          INTEGER NOT NULL DEFAULT 0  -- 0 = van fel nem kuldott valtozasa
  );

  CREATE TABLE outbox (
    mutationId      TEXT PRIMARY KEY NOT NULL,  -- UUID, a szerver ezzel ismeri fel az ismetelt kuldest
    entity          TEXT NOT NULL,              -- 'Vehicle', kesobb 'FuelLog', ...
    entityId        TEXT NOT NULL,
    op              TEXT NOT NULL,              -- 'UPSERT' | 'DELETE'
    baseVersion     INTEGER,                    -- a szerver verzio, amibol a valtozas indult; NULL = uj sor
    clientUpdatedAt TEXT NOT NULL,
    payload         TEXT,                       -- JSON, UPSERT-nel a teljes sor
    status          TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | IN_FLIGHT | FAILED
    attempts        INTEGER NOT NULL DEFAULT 0,
    lastError       TEXT,
    createdAt       TEXT NOT NULL
  );
  -- egy sorhoz egyszerre csak egy varakozo bejegyzes lehet (osszevonas, lasd outboxRepository)
  CREATE UNIQUE INDEX outbox_entity ON outbox(entity, entityId) WHERE status <> 'IN_FLIGHT';

  CREATE TABLE sync_state (
    key   TEXT PRIMARY KEY NOT NULL,            -- pl. 'lastPulledVersion', 'lastSyncAt'
    value TEXT
  );
  `,
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // ezt a tranzakcion kivul kell beallitani
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{user_version: number}>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current > MIGRATIONS.length) {
    throw new Error('A helyi adatbazis ujabb, mint amit ez az app ismer.');
  }

  for (let version = current + 1; version <= MIGRATIONS.length; version++) {
    // a migracio es a verzioszam egy tranzakcioban: hiba eseten mindketto visszaall
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version - 1]);
      await db.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}
