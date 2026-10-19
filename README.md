# Autó karbantartás-követő alkalmazás

Diplomamunka projekt — mobil alkalmazás gépjárművek karbantartásának, üzemanyag-fogyasztásának, biztosításának, útadójának és OBD2 diagnosztikájának követésére, beépített AI-s hibakód-értelmezéssel és karbantartás-predikcióval.

## Tech stack

| Réteg | Technológia |
|---|---|
| Mobil frontend | React Native + TypeScript, Expo (Custom Development Client), Expo Router |
| Backend | NestJS + TypeScript |
| ORM | Prisma |
| Adatbázis | SQL Server 2025 Express |
| Offline tárolás | SQLite (mobil kliens oldalon) |
| API | REST / JSON |
| Autentikáció | JWT + refresh token |

## Monorepo struktúra

```
car-maintenance-tracker/
├── apps/
│   ├── backend/        NestJS API + Prisma schema
│   └── mobile/         Expo / React Native mobil app
├── eslint.config.base.mjs   közös ESLint alapkonfiguráció
├── .prettierrc.cjs           közös Prettier konfiguráció
└── package.json              workspace gyökér (npm workspaces)
```

## Előfeltételek

- Node.js (LTS) és npm
- SQL Server 2025 Express (lokálisan telepítve, vagy elérhető instance)
- Expo CLI használatához: Android Studio / Xcode, vagy fizikai eszköz az Expo Go / Dev Client-hez

## Telepítés

```bash
git clone https://github.com/baloogedit/car-maintenance-tracker.git
cd car-maintenance-tracker
npm install
```

Az `apps/backend` alatt hozz létre egy `.env` fájlt a saját SQL Server kapcsolati adataiddal (lásd `apps/backend/.env.example`, ha van, vagy a Prisma `DATABASE_URL` formátumát).

## Fejlesztés közben használt parancsok

A gyökérből futtatva (npm workspaces segítségével mindkét app-ot eléri):

| Parancs | Mit csinál |
|---|---|
| `npm run dev` | backend + mobile egyszerre, külön színezett logokkal (concurrently) |
| `npm run dev:backend` | csak a NestJS backend (watch módban) |
| `npm run dev:mobile` | csak az Expo dev szerver |
| `npm run lint` | lint futtatása mindkét workspace-en |
| `npm run lint:backend` / `npm run lint:mobile` | lint csak az egyik app-on |
| `npm run format` | Prettier formázás az egész repóra |
| `npm run format:check` | csak ellenőrzés, nem ír felül semmit (CI-hez hasznos) |
| `npm run test` | tesztek futtatása minden workspace-en, ahol van test script |
| `npm run typecheck` | TypeScript típusellenőrzés mindkét app-on |

## Adatbázis (Prisma)

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed
npx prisma studio   # vizuális adatnézet böngészőben
```

## Licenc

Diplomamunka keretében készült projekt — nem publikus felhasználásra.
