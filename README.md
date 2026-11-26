# Autó karbantartás-követő alkalmazás

Diplomamunka projekt — mobil alkalmazás gépjárművek karbantartásának, üzemanyag-fogyasztásának, biztosításának, útadójának és OBD2 diagnosztikájának követésére, beépített AI-s hibakód-értelmezéssel és karbantartás-predikcióval.

## Tech stack

| Réteg           | Technológia                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| Mobil frontend  | React Native + TypeScript, Expo (Custom Development Client), Expo Router      |
| Backend         | NestJS 12 + TypeScript, Swagger (OpenAPI) dokumentáció                        |
| ORM             | Prisma 6                                                                      |
| Adatbázis       | SQL Server 2025 Express                                                       |
| Offline tárolás | SQLite (mobil kliens oldalon), szinkronizálás a backenddel                    |
| API             | REST / JSON, `/api/v1` előtaggal                                              |
| Autentikáció    | JWT access token (30 perc) + rotált refresh token (60 nap, hash-elve tárolva) |

## Monorepo struktúra

```
car-maintenance-tracker/
├── apps/
│   ├── backend/        NestJS API + Prisma séma (felépítés: apps/backend/KONVENCIOK.md)
│   └── mobile/         Expo / React Native mobil app, offline-first (felépítés: apps/mobile/KONVENCIOK.md)
├── eslint.config.base.mjs   közös ESLint alapkonfiguráció
├── .prettierrc.cjs           közös Prettier konfiguráció
└── package.json              workspace gyökér (npm workspaces)
```

### Backend felépítése

```
apps/backend/src/
├── auth/        regisztráció, belépés, token frissítés és kijelentkezés
├── company/     cég létrehozása, csatlakozás csatlakozási kóddal
├── health/      GET /health
├── vehicle/     járművek (CRUD, soft delete)
├── sync/        offline szinkron: POST /sync/push, GET /sync/pull
└── shared/      közös elemek: config, guardok, dekorátorok, jogosultsági szabályok, adatbázis
```

Minden funkció saját mappát kap, `dto/input`, `dto/output` és `mapper/` almappákkal. A részletes szabályok (mappaszerkezet, elnevezések, új funkció felvétele) az [`apps/backend/KONVENCIOK.md`](apps/backend/KONVENCIOK.md) fájlban vannak.

### Mobil felépítése

```
apps/mobile/src/
├── app/          Expo Router útvonalak: (auth)/ belépés, (app)/(tabs)/ alsó fülsáv, jármű adatlap és űrlap
├── components/   atoms/, molecules/, organisms/, forms/ (atomic design)
├── api/          REST kliens (token, automatikus frissítés) és témánkénti API modulok
├── db/           SQLite: migrációk és repositoryk (a képernyők csak ezt olvassák)
├── sync/         szinkron motor: outbox push, majd pull a kurzor óta
├── store/        zustand store-ok (belépés, szinkron állapot, téma)
├── hooks/        képernyő-logika
└── schemas/, types/, constants/, utils/
```

Az app **offline-first**: minden változás először a helyi SQLite-ba és az outboxba kerül, a szinkron motor pedig hálózat elérhetőségekor feltölti (`/sync/push`), majd letölti a többi eszköz változásait (`/sync/pull`). A részletes szabályok az [`apps/mobile/KONVENCIOK.md`](apps/mobile/KONVENCIOK.md) fájlban vannak.

## Előfeltételek

- Node.js 22 vagy újabb és npm (a backend tesztjeihez **Node 24.9+** kell)
- SQL Server 2025 Express (lokálisan telepítve, vagy elérhető instance)
- Android telefon fejlesztői módban (USB hibakereséssel) vagy Android Studio emulátor
- Android Studio SDK Platform-Tools (`adb`), a `platform-tools` mappa a `PATH`-ban
- Expo fiók és EAS CLI (`npm install -g eas-cli`) a dev client buildhez

## Telepítés

```bash
git clone https://github.com/baloogedit/car-maintenance-tracker.git
cd car-maintenance-tracker
npm install
```

Az `apps/backend` alatt hozz létre egy `.env` fájlt az `apps/backend/.env.example` alapján:

| Változó                  | Leírás                                                    |
| ------------------------ | --------------------------------------------------------- |
| `DATABASE_URL`           | SQL Server kapcsolati szöveg (Prisma formátum)            |
| `JWT_ACCESS_SECRET`      | hosszú, véletlen titkos kulcs az access token aláírásához |
| `JWT_ACCESS_EXPIRES_IN`  | az access token élettartama, pl. `30m`                    |
| `JWT_REFRESH_EXPIRES_IN` | a refresh token élettartama, pl. `60d`                    |

Titkos kulcs generálása:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

A backend induláskor ellenőrzi a kötelező változókat, és ha valamelyik hiányzik, érthető hibával leáll.

## A mobil app futtatása

Az app nem Expo Go-ban, hanem saját **development buildben** (dev client) fut, mert natív csomagokat használ (SQLite, SecureStore).

1. **Dev client build** (csak először, és ha új natív csomag kerül be). Az `apps/mobile` mappában:

   ```bash
   eas build --profile development --platform android
   eas build:run --platform android --latest   # emulátorra telepíti
   ```

   Fizikai telefonra: az expo.dev build oldaláról töltsd le az `.apk`-t, majd `adb install -r <fájl>.apk` (vagy olvasd be a build oldalán lévő QR-kódot a telefonnal).

   Windowson a helyi build (`npx expo run:android`) hosszú repó útvonalnál a 260 karakteres útvonalkorlát miatt elhasalhat, ezért EAS-en (felhőben) buildelünk.

2. **A backend címe:** `apps/mobile/.env.local` (nem kerül a repóba):

   | Eszköz        | `EXPO_PUBLIC_API_URL`       |
   | ------------- | --------------------------- |
   | telefon USB-n | `http://localhost:3000`     |
   | emulátor      | `http://10.0.2.2:3000`      |
   | telefon wifin | `http://<a gép IP-je>:3000` |

3. **Indítás** a gyökérből: `npm run dev:phone` (USB-s telefon) vagy `npm run dev` (emulátor, wifi). A telefonon nyisd meg a dev client appot.

4. **Offline teszt** (USB-s telefonnál): a futó `dev:phone` mellett egy második terminálban `npm run offline`. Ilyenkor a telefon nem éri el a backendet, de az app tovább működik: a változások a helyi SQLite-ba és az outboxba kerülnek, a szinkron jelző „Offline”-t mutat. `npm run online` után a „Szinkronizálás most” gombra (vagy magától, a következő körben) felmennek a szerverre. Közben ne töltsd újra az appot.

## Fejlesztés közben használt parancsok

A gyökérből futtatva (npm workspaces segítségével mindkét app-ot eléri):

| Parancs                                        | Mit csinál                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `npm run dev`                                  | backend + mobile egyszerre, külön színezett logokkal (concurrently)       |
| `npm run dev:backend`                          | csak a NestJS backend (watch módban)                                      |
| `npm run dev:mobile`                           | csak az Expo dev szerver                                                  |
| `npm run dev:phone`                            | mint a `dev`, de előtte `adb reverse` a USB-s telefonhoz                  |
| `npm run offline` / `npm run online`           | USB-s telefonnál leveszi / visszateszi a backend elérését (offline teszt) |
| `npm run lint`                                 | lint futtatása mindkét workspace-en                                       |
| `npm run lint:backend` / `npm run lint:mobile` | lint csak az egyik app-on                                                 |
| `npm run format`                               | Prettier formázás az egész repóra                                         |
| `npm run format:check`                         | csak ellenőrzés, nem ír felül semmit (CI-hez hasznos)                     |
| `npm run test`                                 | tesztek futtatása minden workspace-en, ahol van test script               |
| `npm run typecheck`                            | TypeScript típusellenőrzés mindkét app-on                                 |

## Adatbázis (Prisma)

Az `apps/backend` mappában:

```bash
npx prisma migrate deploy   # a migrációk alkalmazása
npx prisma generate         # a Prisma kliens újragenerálása (sémaváltozás után)
npm run seed                # alap tesztadatok (mindent töröl előtte)
npm run seed:2              # bővebb tesztadatok (cégek, több jármű), újrafuttatható
npx prisma studio           # adatbázis modellek vizuális megjelenítése és szerkesztése
```

Minden seed felhasználó jelszava `Teszt1234!`. Például: `magan@teszt.hu` (magánszemély), `fanni@seed2.teszt.hu` (céges admin), `gabor@seed2.teszt.hu` (cégtag).

## API kipróbálása

A backend elindítása után (`npm run dev:backend`):

- **Swagger UI:** http://localhost:3000/api/docs — belépés után az `accessToken`-t az **Authorize** gombnál kell megadni.
- **Health:** http://localhost:3000/api/v1/health

| Végpont                                         | Mit csinál                                            |
| ----------------------------------------------- | ----------------------------------------------------- |
| `POST /auth/register`, `/login`                 | regisztráció és belépés, tokenpárt ad vissza          |
| `POST /auth/refresh`, `/logout`                 | token frissítés (rotáció) és kijelentkezés            |
| `GET /auth/me`                                  | a saját profil                                        |
| `POST /companies`                               | cég létrehozása, a létrehozó lesz az admin            |
| `POST /companies/join`                          | csatlakozás egy céghez a csatlakozási kóddal          |
| `GET /companies/me`                             | a saját cég (a kódot csak az admin látja)             |
| `POST /companies/me/join-code`                  | új csatlakozási kód (csak admin)                      |
| `POST /companies/me/leave`                      | kilépés a cégből (az utolsó admin nem léphet ki)      |
| `GET /companies/me/members`                     | a cég tagjai (csak admin)                             |
| `PATCH`, `DELETE /companies/me/members/:userId` | szerepkörváltás, tag eltávolítása (csak admin)        |
| `GET`, `POST /vehicles`                         | a látható járművek listája, új jármű                  |
| `GET`, `PATCH`, `DELETE /vehicles/:vehicleId`   | egy jármű lekérése, módosítása, törlése (soft delete) |
| `POST /sync/push`                               | offline változások feltöltése (LWW, idempotens)       |
| `GET /sync/pull?since=&limit=&scope=`           | a változott sorok letöltése a kurzor óta              |

**Jogosultságok röviden:** a magánszemély csak a saját járműveit látja. A céges felhasználók a cég összes járművét látják, és lehetnek saját magánjárműveik is (`isCompanyVehicle: false`), amiket a cég nem lát. A cégtag csak a saját bejegyzéseit szerkesztheti. A szerepkört és a cégtagságot a backend minden kérésnél az adatbázisból ellenőrzi.

## Tesztek

Az `apps/backend` mappában (Node 24.9+ szükséges):

```bash
npm test            # egységtesztek
npm run test:e2e    # végponttól végpontig tesztek a valódi adatbázison (előtte: npm run seed && npm run seed:2)
```

## Licenc

Diplomamunka keretében készült projekt — nem publikus felhasználásra.
