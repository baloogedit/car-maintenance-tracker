import {JwtPayload} from '../interfaces/jwt-payload.interface';

// A szinkron dontesi szabalyai tiszta fuggvenyekkent (adatbazis nelkul
// tesztelhetok: sync.policy.spec.ts). A sync/ modul service-ei alkalmazzak oket.

// ---------- Oraelteres korrekcio ----------
// A telefon oraja elterhet a szerveretol. A push clientNow mezojebol szamolt
// eltolassal a kliens idobelyeget szerver idore normaljuk; a jovobe mutato
// erteket a szerver idejere vagjuk, hogy egy rosszul beallitott oraju eszkoz
// ne nyerjen meg minden vitat.
export function effectiveClientTime(clientUpdatedAt: Date, clientNow: Date, serverNow: Date): Date {
  const offsetMs = serverNow.getTime() - clientNow.getTime();
  const corrected = clientUpdatedAt.getTime() + offsetMs;
  return new Date(Math.min(corrected, serverNow.getTime()));
}

// ---------- Last Write Wins ----------
export interface IncomingWrite {
  baseVersion: bigint | null; // a kliens altal utoljara latott szerver version (null = uj sor a kliensen)
  effectiveUpdatedAt: Date; // az orajavitott clientUpdatedAt
  deviceId: string;
}

export interface StoredRow {
  version: bigint;
  clientUpdatedAt: Date;
  lastModifiedByDeviceId: string | null;
}

// Nyer-e a bejovo iras a szerveren tarolt sorral szemben?
//   - ha a kliens a legutolso verziora epitett (baseVersion = version): nincs
//     konfliktus, mindig nyer
//   - kulonben sor szintu LWW: a kesobbi clientUpdatedAt nyer; egyenlosegnel a
//     nagyobb deviceId, hogy a dontes determinisztikus legyen
export function incomingWins(incoming: IncomingWrite, stored: StoredRow): boolean {
  if (incoming.baseVersion !== null && incoming.baseVersion === stored.version) return true;
  const diff = incoming.effectiveUpdatedAt.getTime() - stored.clientUpdatedAt.getTime();
  if (diff !== 0) return diff > 0;
  return incoming.deviceId > (stored.lastModifiedByDeviceId ?? '');
}

// ---------- Lathatosagi kor (scope) ----------
// Ha ez megvaltozik (cegbe lepes, kilepes, eltavolitas), a felhasznalo mas
// jarmuveket lat: a kurzor alatti, most lathatova valt sorokat a delta nem hozna
// el, a mar nem lathatokat pedig nem torolne. Ilyenkor a pull resetRequired-et
// jelez, es a kliens since=0-rol ujrahuz.
export function syncScopeOf(user: JwtPayload): string {
  return `${user.sub}:${user.companyId ?? '-'}`;
}

// ---------- Pull oldal osszeallitasa ----------
export interface VersionedRow {
  version: bigint;
}

export interface PullPage<T extends VersionedRow> {
  rows: T[];
  cursor: bigint;
  hasMore: boolean;
}

// A tablankent lekerdezett sorokbol (mindegyik since < version < upper,
// version szerint novekvo, tablankent legfeljebb limit + 1 sor) osszeallitja az
// oldalt: a legkisebb limit darab version. Ha nincs tobb sor, a kurzor upper - 1,
// mert minden upper alatti, lathato sort visszaadtunk; a kovetkezo pull igy nem
// nezi at ujra a koztes (masok altal irt) verziokat.
export function buildPullPage<T extends VersionedRow>(
  rowsPerTable: T[][],
  limit: number,
  since: bigint,
  upper: bigint,
): PullPage<T> {
  const all = rowsPerTable.flat().sort((a, b) => (a.version < b.version ? -1 : 1));
  const hasMore = all.length > limit;
  const rows = all.slice(0, limit);
  if (hasMore) {
    return {rows, cursor: rows[rows.length - 1].version, hasMore};
  }
  const end = upper - 1n;
  return {rows, cursor: end > since ? end : since, hasMore};
}
