# Backend – felépítés és kódolási szabályok

Ez a fájl leírja, hogyan épül fel az `apps/backend`, és milyen szabályok szerint bővítjük. Új funkció hozzáadása előtt érdemes átfutni.

## Mappaszerkezet

A szerkezet a korábbi (webshop) alkalmazás mintáját követi, hogy a kettő között könnyű legyen mozogni.

```
src/
├── main.ts                      indítás (csak a shared/bootstrap függvényeit hívja)
├── app.module.ts                a modulfa gyökere: itt veszünk fel minden feature modult
├── auth/                        belépés: dto/input, dto/output, mapper/, token/
├── company/                     cégek: létrehozás, csatlakozás kóddal
├── health/                      GET /health
├── vehicle/                     járművek: dto/input, dto/output, mapper/, deletion/
└── shared/                      több feature által használt elemek
    ├── shared.module.ts         globális modul: DbModule + AccessModule
    ├── bootstrap/               globális beállítások (main.ts és e2e tesztek közösen)
    ├── config/                  .env ellenőrzés és típusos beállítások (registerAs)
    ├── constants/               témánként egy *.constants.ts
    ├── decorators/
    ├── enums/
    ├── filters/
    ├── guards/                  jwt.guard (globális), roles.guard (@Roles), vehicle-access.guard
    ├── interfaces/
    ├── modules/
    │   ├── access/              AccessService (jogosultság-ellenőrzés)
    │   └── db/                  PrismaService
    ├── policies/                tiszta jogosultsági szabályok
    └── utils/
test/
├── utils/                       közös e2e segédek (alkalmazás indítása, belépés, seed felhasználók)
└── <feature>.e2e-spec.ts        funkciónként egy e2e fájl
```

### Egy feature modul felépítése

Minden üzleti funkció (pl. `vehicle`, később `fuel-log`, `maintenance`, `sync`) saját, **egyes számú** mappát kap, mindig ugyanazzal a szerkezettel:

```
<feature>/
├── dto/
│   ├── input/                   a kérés törzse / query: create-<x>.dto.ts, update-<x>.dto.ts, <x>-list-query.dto.ts
│   └── output/                  a válasz: <x>-response.dto.ts (osztály @ApiProperty-vel, a Swagger miatt)
├── mapper/<feature>.mapper.ts   Prisma rekord -> output DTO (to<X>Response)
├── <al-feladat>/                ha a feature-nek mellék-service-e van: token/token.service.ts, deletion/...
├── <feature>.controller.ts      csak útvonalak és paraméterek, logika nincs benne
├── <feature>.service.ts         az üzleti logika
├── <feature>.module.ts
└── *.spec.ts                    egységteszt a tesztelt fájl mellett
```

Csak azokat az almappákat kell létrehozni, amelyekre ténylegesen szükség van. Ha egy feature később szerepkörönként külön végpontokat kap (mint a webshopban a `user/` és `vendor/`), azok a feature alatti almappába kerülnek saját modullal: `fuel-log/company/fuel-log-company.controller.ts`.

## Elnevezések

| Mi                | Szabály                                                                                                                                                                                            | Példa                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Fájlnév           | kebab-case + szerep utótag                                                                                                                                                                         | `vehicle-access.guard.ts`, `create-vehicle.dto.ts`                 |
| Utótagok          | `.module`, `.controller`, `.service`, `.dto`, `.guard`, `.decorator`, `.filter`, `.enum`, `.interface`, `.constants`, `.util`, `.policy`, `.mapper`, `.config`, `.validator`, `.spec`, `.e2e-spec` |                                                                    |
| Osztály           | PascalCase + szerep                                                                                                                                                                                | `VehicleDeletionService`, `CreateVehicleDto`, `VehicleResponseDto` |
| Interfész, típus  | PascalCase, `I` előtag nélkül                                                                                                                                                                      | `JwtPayload`, `AuthenticatedRequest`                               |
| Enum              | PascalCase név, NAGYBETŰS értékek, az érték megegyezik a névvel                                                                                                                                    | `FuelType.DIESEL = 'DIESEL'`                                       |
| Állandó           | SCREAMING_SNAKE_CASE                                                                                                                                                                               | `NOT_DELETED`, `VIN_LENGTH`                                        |
| Függvény, változó | camelCase                                                                                                                                                                                          | `parseDuration`, `toVehicleResponse`                               |
| Mappa             | kebab-case, egyes szám a feature-nél (az URL marad többes: `/vehicles`)                                                                                                                            | `vehicle/`, `fuel-log/`                                            |

## Szabályok

1. **Egy fájl, egy felelősség.** Egy fájlban egy osztály, egy DTO, egy enum vagy egy összetartozó függvénycsoport legyen.
2. **Nincs gyűjtőfájl (`index.ts`).** Minden import a konkrét fájlra mutat: `import {CurrentUser} from '../shared/decorators/current-user.decorator'`. Így mindig látszik, honnan jön valami.
3. **Input és output DTO külön.** A kérés DTO-ja validál (`class-validator`), a válasz DTO-ja csak leír (`@ApiProperty`). A service output DTO-t ad vissza, Prisma rekordot soha: az átalakítás a `mapper/` dolga.
4. **A controller vékony.** Csak az útvonalat, a guardokat és a paramétereket kezeli, minden mást a service-nek ad tovább. Szerepkörhöz kötött útvonalon `@Roles(UserRole.…)`.
5. **A jogosultsági szabály tiszta függvény** a `shared/policies/` mappában, adatbázis-hívás nélkül. A service csak alkalmazza és hibát dob. Így a szabály adatbázis nélkül egységtesztelhető.
6. **Mágikus számok helyett állandó.** A korlátokat (`VIN_LENGTH`, `PASSWORD_MIN_LENGTH`) a `shared/constants/<téma>.constants.ts` tartalmazza, a DTO és a Swagger is ezt használja.
7. **Beállítás csak a `shared/config/` mappán keresztül.** A service-ek nem olvasnak `process.env`-et, hanem a típusos beállítást injektálják (`@Inject(authConfig.KEY)`).
8. **Soft delete.** A szinkronizált táblákból nem törlünk fizikailag. A lekérdezésekben mindig szerepel a `NOT_DELETED` feltétel, a törlés pedig `deletedAt` kitöltése.
9. **Hibák:**
   - nem látható erőforrás → `404`
   - látható, de nem szerkeszthető → `403`
   - rossz bemenet → `400` (ValidationPipe)
   - ütközés → `409`
10. **Típusos importok a dekorált paramétereknél.** Ha egy interfész vagy Prisma típus dekorált paraméterben szerepel, `import type`-pal importáljuk, különben a TypeScript `isolatedModules` módban hibát jelez.
11. **Kommentek** magyarul, ékezet nélkül, és arról szólnak, _miért_ van valami így, nem arról, hogy mit csinál a kód.
12. **Formázás és importsorrend:** a Prettier és az ESLint (`simple-import-sort`) dönt. Mentés előtt `npm run lint` és `npm run format`.

## Új funkció hozzáadása (pl. tankolások)

1. Hozd létre a `src/fuel-log/` mappát a fenti szerkezettel: `dto/input/`, `dto/output/`, `mapper/`, `fuel-log.controller.ts`, `fuel-log.service.ts`, `fuel-log.module.ts`.
2. A korlátokat tedd a `shared/constants/fuel-log.constants.ts`-be.
3. A jármű alá tartozó útvonalakon használd a `VehicleAccessGuard`-ot és a `@CurrentVehicle()` dekorátort (`/vehicles/:vehicleId/fuel-logs`).
4. A szerkesztésnél hívd az `AccessService.assertCanEditEntry`-t.
5. Ha az új tábla járműhöz kötött, vedd fel a `VehicleDeletionService` tranzakciójába is.
6. Vedd fel a modult az `app.module.ts` `imports` listájába.
7. Írj egy `test/fuel-logs.e2e-spec.ts` fájlt a `test/utils` segédeivel.
