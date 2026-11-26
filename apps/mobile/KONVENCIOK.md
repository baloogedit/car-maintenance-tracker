# Mobil – felépítés és kódolási szabályok

Ez a fájl leírja, hogyan épül fel az `apps/mobile`, és milyen szabályok szerint bővítjük. Új képernyő vagy új szinkronizált tábla előtt érdemes átfutni.

## Alapelv: offline-first

A képernyők **soha nem hívják közvetlenül a backendet** a szinkronizált adatokért (járművek, később tankolások, karbantartások). Mindig a helyi SQLite adatbázist olvassák és írják, a szerverrel a szinkron motor tartja a kapcsolatot:

```
képernyő ──> hook ──> db/repositories ──> SQLite
                              │
                              └─> outbox (a helyi változások sora)
                                        │
sync/syncEngine.ts ── push ──> POST /sync/push
                   └─ pull <── GET  /sync/pull
```

Közvetlen API-hívás csak a nem szinkronizált műveleteknél van: belépés, regisztráció, cég létrehozása, csatlakozás, tagok kezelése (`api/authApi.ts`, `api/companyApi.ts`).

## Mappaszerkezet

A szerkezet a korábbi (webshop) frontend mintáját követi.

```
src/
├── app/                         Expo Router útvonalak (a webshop pages/ mappájának megfelelője)
│   ├── _layout.tsx              gyökér: téma, AuthInitializer, SyncInitializer
│   ├── (auth)/                  login, register (csak kijelentkezve)
│   └── (app)/                   belépve: (tabs)/ alsó fülsáv, vehicle/[vehicleId], vehicle-form
├── components/
│   ├── atoms/                   legkisebb építőelemek: AppText, Button, Input, Card, Icon ...
│   ├── molecules/               atomokból összerakott elemek: TextField, VehicleCard, SyncStatusPill ...
│   ├── organisms/               nagyobb, önálló blokkok: ScreenContainer, SyncPanel, CompanyPanel ...
│   └── forms/                   react-hook-form űrlapok: Form* mezők + <Téma>Forms/ almappák
├── api/                         apiClient.ts (fetch, token, frissítés) + <téma>Api.ts
├── db/                          database.ts, migrations.ts, repositories/<x>Repository.ts
├── sync/                        syncEngine.ts (push + pull kör)
├── store/                       zustand store-ok: use<X>Store.ts
├── hooks/                       képernyő-logika: use<X>.ts
├── schemas/                     zod sémák: <X>Schema.ts
├── types/                       TypeScript típusok: <x>.types.ts
├── constants/                   állandók, téma, paletta, validációs korlátok és üzenetek
└── utils/                       segédfüggvények és láthatatlan komponensek (AuthInitializer ...)
```

## Elnevezések

| Mi                    | Szabály                                                  | Példa                                    |
| --------------------- | -------------------------------------------------------- | ---------------------------------------- |
| Komponens fájl        | PascalCase, a komponens nevével egyezik                  | `VehicleCard.tsx`, `JoinCompanyForm.tsx` |
| Útvonal fájl (`app/`) | kisbetű / kebab-case, az Expo Router szerint             | `vehicle-form.tsx`, `[vehicleId].tsx`    |
| Hook                  | `use` + PascalCase                                       | `useVehicleForm.ts`, `useLocalQuery.ts`  |
| Store                 | `use<X>Store.ts`                                         | `useAuthStore.ts`, `useSyncStore.ts`     |
| Repository            | `<x>Repository.ts`, camelCase                            | `vehicleRepository.ts`                   |
| API modul             | `<x>Api.ts`, egy objektumot exportál                     | `syncApi.push(...)`                      |
| Zod séma              | `<X>Schema.ts`                                           | `VehicleSchema.ts`, `UserLoginSchema.ts` |
| Típusfájl             | `<x>.types.ts`                                           | `vehicle.types.ts`                       |
| Állandó               | SCREAMING_SNAKE_CASE                                     | `VIN_LENGTH`, `API_BASE_URL`             |
| SQLite tábla, oszlop  | tábla snake_case, oszlop camelCase (a backend mezőnevei) | `vehicle.currentMileage`, `sync_state`   |

## Szabályok

1. **Az útvonal fájl vékony.** Az `app/` alatti fájl csak összerakja a képernyőt (fejléc, `ScreenContainer`, egy-két komponens). A logika a `hooks/use<X>.ts`-be kerül.
2. **Atomic design.** Az atom nem importál molekulát, a molekula nem importál organizmust. Az űrlapmezők (`FormInput`, `FormSwitch`, `FormChoiceChips`) a `forms/` gyökerében vannak, a konkrét űrlapok témánként almappában (`forms/VehicleForms/VehicleForm.tsx`).
3. **Nincs gyűjtőfájl (`index.ts`).** Minden import a konkrét fájlra mutat, az `@/` alias-szal: `import {Button} from '@/components/atoms/Button'`. Egy mappán belül relatív import is jó (`./apiClient`).
4. **Nevesített export**, kivéve az `app/` útvonalakat, ahol az Expo Router `export default`-ot vár.
5. **Szinkronizált adat csak repositoryn keresztül.** A képernyő a `useLocalQuery`-vel olvas, és a repository függvényeivel ír. A repository minden írása egy tranzakcióban frissíti a táblát **és** az outboxot, majd `notifyLocalChange()`-dzsel jelez a szinkron motornak.
6. **Az azonosítót a telefon generálja** (`randomUUID` az `expo-crypto`-ból), így offline létrehozott sor is végleges azonosítót kap.
7. **Soft delete.** A szinkronizált táblákból nem törlünk fizikailag; a `deletedAt` kitöltése a törlés, a listák `deletedAt IS NULL` feltétellel olvasnak.
8. **Űrlap = zod séma + react-hook-form.** A korlátok a `constants/validation.constants.ts`-ben, a hibaüzenetek a `constants/validationMessages.ts`-ben vannak, és egyeznek a backend korlátaival.
9. **Színek csak a témából.** Komponensben nincs beégetett szín: `useTheme()` és a `constants/theme.ts` (emerald = elsődleges, sky = másodlagos, slate = semleges). Világos és sötét témában is ellenőrizni kell.
10. **Szöveg a felületen magyarul, ékezettel.** Kommentek magyarul, ékezet nélkül, és arról szólnak, _miért_ van valami így.
11. **Natív csomag** csak `npx expo install <csomag>`-gal kerülhet be (az SDK-hoz illő verziót választja). Natív csomag után új dev client build kell (`eas build --profile development --platform android`); sima JS-változásnál nem.
12. **Formázás és importsorrend:** a Prettier és az ESLint dönt. Commit előtt a gyökérből `npm run lint`, `npm run typecheck`, `npm run format:check`.

## Új képernyő hozzáadása

1. Útvonal fájl az `app/(app)/` alá (fül esetén az `app/(app)/(tabs)/` alá, és a `(tabs)/_layout.tsx`-ben egy új `Tabs.Screen`).
2. A logika egy új `hooks/use<X>.ts`-be.
3. A felület meglevő atomokból és molekulákból; ha új elem kell, az a megfelelő `components/` szintre.

## Új szinkronizált tábla (pl. tankolások)

A backend oldali párja a backend `KONVENCIOK.md` „Új szinkronizált tábla” része.

1. `types/<x>.types.ts`: a képernyők típusa és a beviteli típus (`FuelLog`, `FuelLogInput`).
2. `db/migrations.ts`: **új elem a tömb végére** (`CREATE TABLE fuel_log ...`, ugyanazokkal a szinkron mezőkkel: `clientUpdatedAt`, `version`, `deletedAt`). A már kiadott migrációkat nem módosítjuk.
3. `db/repositories/<x>Repository.ts`: list/get/create/update/delete (outboxszal), valamint `apply<X>FromServer` és `mark<X>Synced` (a `vehicleRepository.ts` a minta).
4. `types/sync.types.ts`: a `SyncEntity` új értéke (`'FuelLog'`) és a push `data` típusa.
5. `sync/syncEngine.ts`: új sor az `APPLY_SERVER_ROW` és a `MARK_SYNCED` táblában, és az `ENTITY_ORDER`-be a szülő (`Vehicle`) **után**.
6. `schemas/<X>Schema.ts`, `hooks/use<X>Form.ts`, `components/forms/<X>Forms/<X>Form.tsx`, és az útvonal(ak).
7. Teszt: offline létrehozás → online szinkron → a backend adatbázisában is megjelenik (lásd az utmutató 18. lépését).
