import {useCallback} from 'react';

import {authApi} from '@/api/authApi';
import {deleteUserDatabase, getDb} from '@/db/database';
import {countByStatus} from '@/db/repositories/outboxRepository';
import {useAuthStore} from '@/store/useAuthStore';
import {useSyncStore} from '@/store/useSyncStore';
import {confirmAction} from '@/utils/confirm';

export function useLogout() {
  return useCallback(async () => {
    const {tokens, user, clearSession} = useAuthStore.getState();

    // fel nem kuldott valtozas eseten figyelmeztetunk, mert a helyi adatbazis torlodik
    if (useSyncStore.getState().dbReady) {
      const {pending, failed} = await countByStatus(getDb());
      const unsent = pending + failed;
      if (unsent > 0) {
        const ok = await confirmAction(
          'Nem szinkronizált változások',
          `${unsent} változás még nincs a szerveren. Ha most kijelentkezel, ezek elvesznek.`,
          'Kijelentkezés',
        );
        if (!ok) {
          return;
        }
      }
    }

    if (tokens) {
      // a szerveren is visszavonjuk; ha nem sikerul (offline), helyben akkor is kilepunk
      await authApi.logout(tokens.refreshToken).catch(() => undefined);
    }
    useSyncStore.getState().reset();
    if (user) {
      await deleteUserDatabase(user.id);
    }
    await clearSession();
  }, []);
}
