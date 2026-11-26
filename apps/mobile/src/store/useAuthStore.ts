import {create} from 'zustand';

import type {AuthResponse, AuthTokens, User} from '@/types/auth.types';
import {clearStoredSession, saveRefreshToken, saveUser} from '@/utils/sessionStorage';

// A bejelentkezesi allapot egy helyen. Komponensbol: useAuthStore((s) => s.user),
// komponensen kivulrol (pl. apiClient): useAuthStore.getState().
type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  tokens: AuthTokens | null;
  // belepes / regisztracio / cegvaltas utan: tokenek + profil
  setSession: (session: AuthResponse) => Promise<void>;
  // /auth/refresh utan: csak uj tokenpar
  setTokens: (tokens: AuthTokens) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  user: null,
  tokens: null,

  setSession: async ({user, ...tokens}) => {
    await saveRefreshToken(tokens.refreshToken);
    await saveUser(user);
    set({status: 'signedIn', user, tokens});
  },

  setTokens: async (tokens) => {
    await saveRefreshToken(tokens.refreshToken);
    set({tokens});
  },

  setUser: async (user) => {
    await saveUser(user);
    set({user});
  },

  // A user-t szandekosan nem nullazzuk: kijelentkezeskor a vedett kepernyok meg
  // egyszer kirajzolodhatnak, mielott a navigacio atiranyit a belepesre.
  clearSession: async () => {
    await clearStoredSession();
    set({status: 'signedOut', tokens: null});
  },
}));

// A vedett (app) kepernyokon a user biztosan megvan.
export function useCurrentUser(): User {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    throw new Error('Nincs bejelentkezett felhasznalo');
  }
  return user;
}
