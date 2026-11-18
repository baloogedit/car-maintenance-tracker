import type {SQLiteDatabase} from 'expo-sqlite';

// Kulcs-ertek parok a szinkron allapotahoz (sync_state tabla).
export type SyncStateKey = 'lastPulledVersion' | 'lastSyncAt' | 'scope';

export async function getSyncState(db: SQLiteDatabase, key: SyncStateKey): Promise<string | null> {
  const row = await db.getFirstAsync<{value: string | null}>(
    'SELECT value FROM sync_state WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function setSyncState(
  db: SQLiteDatabase,
  key: SyncStateKey,
  value: string | null,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}
