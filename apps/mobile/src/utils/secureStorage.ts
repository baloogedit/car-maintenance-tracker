import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';

// Kis kulcs-ertek tarolo a telefon titkositott taroloja folott (expo-secure-store).
// Weben nincs SecureStore, ott a localStorage-t hasznaljuk (csak ellenorzeshez).
const isWeb = Platform.OS === 'web';

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
