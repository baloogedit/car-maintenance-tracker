import Constants from 'expo-constants';

const API_PREFIX = '/api/v1';
const BACKEND_PORT = 3000;

// A backend cime. Sorrend:
// 1. EXPO_PUBLIC_API_URL az apps/mobile/.env.local-ban (pl. http://192.168.1.20:3000)
// 2. Ha nincs megadva: annak a gepnek az IP-je, amin az `expo start` fut. A dev client
//    innen tolti a JS kodot (hostUri, pl. "192.168.1.20:8081"), igy a backend is
//    ugyanazon a gepen, a 3000-es porton erheto el.
// 3. Vegso esetben localhost (web / iOS szimulator).
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:${BACKEND_PORT}`;
}

export const API_BASE_URL = `${resolveBaseUrl()}${API_PREFIX}`;
