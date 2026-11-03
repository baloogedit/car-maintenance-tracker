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
│   └── mobile/         Expo / React Native mobil app
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
└── shared/      közös elemek: config, guardok, dekorátorok, jogosultsági szabályok, adatbázis
```

Minden funkció saját mappát kap, `dto/input`, `dto/output` és `mapper/` almappákkal. A részletes szabályok (mappaszerkezet, elnevezések, új funkció felvétele) az [`apps/backend/KONVENCIOK.md`](apps/backend/KONVENCIOK.md) fájlban vannak.

## Előfeltételek

- Node.js 22 vagy újabb és npm (a backend tesztjeihez **Node 24.9+** kell)
- SQL Server 2025 Express (lokálisan telepítve, vagy elérhető instance)
- Expo CLI használatához: Android Studio / Xcode, vagy fizikai eszköz az Expo Go / Dev Client-hez

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

## Fejlesztés közben használt parancsok

A gyökérből futtatva (npm workspaces segítségével mindkét app-ot eléri):

| Parancs                                        | Mit csinál                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `npm run dev`                                  | backend + mobile egyszerre, külön színezett logokkal (concurrently) |
| `npm run dev:backend`                          | csak a NestJS backend (watch módban)                                |
| `npm run dev:mobile`                           | csak az Expo dev szerver                                            |
| `npm run lint`                                 | lint futtatása mindkét workspace-en                                 |
| `npm run lint:backend` / `npm run lint:mobile` | lint csak az egyik app-on                                           |
| `npm run format`                               | Prettier formázás az egész repóra                                   |
| `npm run format:check`                         | csak ellenőrzés, nem ír felül semmit (CI-hez hasznos)               |
| `npm run test`                                 | tesztek futtatása minden workspace-en, ahol van test script         |
| `npm run typecheck`                            | TypeScript típusellenőrzés mindkét app-on                           |

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

**Jogosultságok röviden:** a magánszemély csak a saját járműveit látja. A céges felhasználók a cég összes járművét látják, és lehetnek saját magánjárműveik is (`isCompanyVehicle: false`), amiket a cég nem lát. A cégtag csak a saját bejegyzéseit szerkesztheti. A szerepkört és a cégtagságot a backend minden kérésnél az adatbázisból ellenőrzi.

## Tesztek

Az `apps/backend` mappában (Node 24.9+ szükséges):

```bash
npm test            # egységtesztek
npm run test:e2e    # végponttól végpontig tesztek a valódi adatbázison (előtte: npm run seed && npm run seed:2)
```

## Licenc

Diplomamunka keretében készült projekt — nem publikus felhasználásra.
