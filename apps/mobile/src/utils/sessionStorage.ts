import type {User} from '@/types/auth.types';

import {deleteSecureItem, getSecureItem, setSecureItem} from './secureStorage';

// A munkamenetbol ennyit mentunk el: a refresh tokent es a profilt. A profil azert
// kell, hogy az app internet nelkul is elinduljon (offline-first): ilyenkor a
// mentett profillal lepunk be, es a tokent majd akkor frissitjuk, ha lesz halozat.
// Az access token rovid eletu, az csak a memoriaban (useAuthStore) el.
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export interface StoredSession {
  refreshToken: string;
  user: User | null;
}

export async function loadStoredSession(): Promise<StoredSession | null> {
  const refreshToken = await getSecureItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }
  const userJson = await getSecureItem(USER_KEY);
  return {refreshToken, user: userJson ? (JSON.parse(userJson) as User) : null};
}

export async function saveRefreshToken(token: string): Promise<void> {
  await setSecureItem(REFRESH_TOKEN_KEY, token);
}

export async function saveUser(user: User): Promise<void> {
  await setSecureItem(USER_KEY, JSON.stringify(user));
}

export async function clearStoredSession(): Promise<void> {
  await deleteSecureItem(REFRESH_TOKEN_KEY);
  await deleteSecureItem(USER_KEY);
}
