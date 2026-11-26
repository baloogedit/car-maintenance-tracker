import NetInfo from '@react-native-community/netinfo';
import {useEffect} from 'react';
import {AppState} from 'react-native';

import {getDb, openUserDatabase, writeTransaction} from '@/db/database';
import {releaseInFlight} from '@/db/repositories/outboxRepository';
import {getSyncState} from '@/db/repositories/syncStateRepository';
import {useCurrentUser} from '@/store/useAuthStore';
import {useSyncStore} from '@/store/useSyncStore';
import {refreshCounts, runSync} from '@/sync/syncEngine';

// Belepes utan megnyitja a felhasznalo helyi adatbazisat, es elinditja a szinkront:
// - azonnal, megnyitaskor
// - amikor az app elotérbe kerul
// - amikor visszajon a halozat
// (a helyi iras utani szinkront a notifyLocalChange inditja). Nem rajzol semmit.
export function SyncInitializer() {
  const user = useCurrentUser();
  const userId = user.id;
  const companyId = user.companyId;

  // adatbazis megnyitasa + elso szinkron. Cegvaltaskor (uj companyId) is lefut: ilyenkor
  // a szerver a pullban resetRequired-del jelzi, hogy mas jarmuveket latunk.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await openUserDatabase(userId);
      if (cancelled) {
        return;
      }
      // egy megszakadt kor bejegyzesei visszakerulnek a sorba
      await writeTransaction((db) => releaseInFlight(db));
      const lastSyncAt = await getSyncState(getDb(), 'lastSyncAt');
      const store = useSyncStore.getState();
      store.setLastSyncAt(lastSyncAt);
      store.setDbReady(true);
      store.bumpDataVersion();
      await refreshCounts();
      await runSync();
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, companyId]);

  // elotérbe kerules es halozat visszaterese
  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && useSyncStore.getState().dbReady) {
        void runSync();
      }
    });
    let wasConnected: boolean | null = null;
    const unsubscribeNet = NetInfo.addEventListener((net) => {
      const connected = net.isConnected === true;
      if (connected && wasConnected === false && useSyncStore.getState().dbReady) {
        void runSync();
      }
      wasConnected = connected;
    });
    return () => {
      appStateSub.remove();
      unsubscribeNet();
    };
  }, []);

  return null;
}
