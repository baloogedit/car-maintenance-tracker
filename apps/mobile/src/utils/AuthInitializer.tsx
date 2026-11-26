import {useEffect} from 'react';

import {ApiError} from '@/api/apiClient';
import {authApi} from '@/api/authApi';
import {useAuthStore} from '@/store/useAuthStore';
import {loadStoredSession} from '@/utils/sessionStorage';

// Inditaskor a mentett munkamenettel visszalep. Offline-first: ha nincs halozat,
// a mentett profillal is belep (a helyi SQLite-bol minden adat latszik), es csak
// akkor jelentkeztet ki, ha a szerver kifejezetten elutasitja a tokent (401).
export function AuthInitializer() {
  useEffect(() => {
    void restoreSession();
  }, []);
  return null;
}

async function restoreSession() {
  const {setTokens, setUser, clearSession} = useAuthStore.getState();
  const stored = await loadStoredSession();
  if (!stored) {
    useAuthStore.setState({status: 'signedOut'});
    return;
  }
  try {
    await setTokens(await authApi.refresh(stored.refreshToken));
    await setUser(await authApi.me());
    useAuthStore.setState({status: 'signedIn'});
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // a refresh tokent a szerver mar nem fogadja el -> uj belepes kell
      await clearSession();
    } else if (stored.user) {
      // nincs halozat: belepunk a mentett profillal; az access token ures, igy az
      // elso online kerest a kliens 401 utan a refresh tokennel ujrakeri
      useAuthStore.setState({
        status: 'signedIn',
        user: stored.user,
        tokens: {accessToken: '', refreshToken: stored.refreshToken, accessExpiresIn: 0},
      });
    } else {
      useAuthStore.setState({status: 'signedOut'});
    }
  }
}
