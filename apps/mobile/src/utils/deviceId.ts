import {randomUUID} from 'expo-crypto';

import {getSecureItem, setSecureItem} from './secureStorage';

// Az eszkoz allando azonositoja: elso inditaskor general egyet, utana mindig
// ugyanazt adja. A szinkron (push) es a refresh tokenek ezzel jelolik az eszkozt.
const DEVICE_ID_KEY = 'deviceId';

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) {
    return cached;
  }
  let id = await getSecureItem(DEVICE_ID_KEY);
  if (!id) {
    id = randomUUID();
    await setSecureItem(DEVICE_ID_KEY, id);
  }
  cached = id;
  return id;
}
