import {deleteDatabaseAsync, openDatabaseAsync, type SQLiteDatabase} from 'expo-sqlite';

import {runMigrations} from './migrations';

// Felhasznalonkent kulon SQLite fajl (db_<userId>.db), igy ha mas lep be ugyanazon a
// telefonon, nem latja az elozo adatait. Egyszerre egy adatbazis van nyitva.

let current: {userId: string; db: SQLiteDatabase} | null = null;
let opening: Promise<SQLiteDatabase> | null = null;

const fileName = (userId: string) => `db_${userId}.db`;

export async function openUserDatabase(userId: string): Promise<SQLiteDatabase> {
  if (current?.userId === userId) {
    return current.db;
  }
  if (opening) {
    return opening;
  }
  opening = (async () => {
    await closeDatabase();
    const db = await openDatabaseAsync(fileName(userId));
    await runMigrations(db);
    current = {userId, db};
    return db;
  })().finally(() => {
    opening = null;
  });
  return opening;
}

// A nyitott adatbazis; a repository-k ezt hasznaljak.
export function getDb(): SQLiteDatabase {
  if (!current) {
    throw new Error('A helyi adatbazis nincs megnyitva');
  }
  return current.db;
}

export async function closeDatabase(): Promise<void> {
  if (current) {
    const {db} = current;
    current = null;
    await db.closeAsync();
  }
}

// Kijelentkezeskor: az adatbazis fajl torlese (a kovetkezo belepes ujra letolti).
export async function deleteUserDatabase(userId: string): Promise<void> {
  if (current?.userId === userId) {
    await closeDatabase();
  }
  await deleteDatabaseAsync(fileName(userId)).catch(() => undefined);
}

// Iras tranzakcioban. A hivasokat sorba allitjuk, hogy ket iras (pl. egy mentes es
// egy epp beerkezo pull) ne keveredjen ossze ugyanazon a kapcsolaton.
let writeQueue: Promise<unknown> = Promise.resolve();

export function writeTransaction<T>(task: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = getDb();
    let result!: T;
    await db.withTransactionAsync(async () => {
      result = await task(db);
    });
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}
