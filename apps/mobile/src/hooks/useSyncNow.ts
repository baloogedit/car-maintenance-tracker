import {useCallback, useState} from 'react';

import {writeTransaction} from '@/db/database';
import {retryFailed} from '@/db/repositories/outboxRepository';
import {runSync} from '@/sync/syncEngine';

// Kezi szinkron (lehuzas a listan, gomb a Profilban), es az elutasitott
// bejegyzesek ujrakuldese (pl. ha a hibat a szerveren javitottak).
export function useSyncNow() {
  const [refreshing, setRefreshing] = useState(false);

  const syncNow = useCallback(async () => {
    setRefreshing(true);
    await runSync();
    setRefreshing(false);
  }, []);

  const retryFailedNow = useCallback(async () => {
    await writeTransaction((db) => retryFailed(db));
    await syncNow();
  }, [syncNow]);

  return {refreshing, syncNow, retryFailedNow};
}
