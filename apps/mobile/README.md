# Mobil app (Expo)

Offline-first React Native alkalmazás az autó karbantartás-követőhöz.

- Telepítés, futtatás és a parancsok: a gyökér [`README.md`](../../README.md) „A mobil app futtatása” része.
- Felépítés és kódolási szabályok: [`KONVENCIOK.md`](KONVENCIOK.md).

Gyakori parancsok ebben a mappában:

| Parancs                                              | Mit csinál                                  |
| ---------------------------------------------------- | ------------------------------------------- |
| `npx expo start`                                     | Metro dev szerver (a dev clienthez)         |
| `npm run usb`                                        | `adb reverse` a 8081-es és a 3000-es portra |
| `npm run lint` / `npm run typecheck`                 | ESLint / TypeScript ellenőrzés              |
| `npx expo install <csomag>`                          | csomag telepítése az SDK-hoz illő verzióban |
| `npx expo-doctor`                                    | függőségek és beállítások ellenőrzése       |
| `eas build --profile development --platform android` | új dev client build (natív változás után)   |
