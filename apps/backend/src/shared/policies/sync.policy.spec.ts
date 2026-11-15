import {UserRole} from '../enums/user-role.enum';
import {
  buildPullPage,
  effectiveClientTime,
  incomingWins,
  StoredRow,
  syncScopeOf,
} from './sync.policy';

// A szinkron dontesi szabalyainak egysegtesztje (adatbazis nelkul).
describe('sync.policy', () => {
  const at = (iso: string) => new Date(iso);

  describe('effectiveClientTime', () => {
    it('a kliens ora eltereset kiegyenliti', () => {
      // a telefon 5 percet siet
      const result = effectiveClientTime(
        at('2026-11-04T10:05:00Z'),
        at('2026-11-04T12:05:00Z'),
        at('2026-11-04T12:00:00Z'),
      );
      expect(result.toISOString()).toBe('2026-11-04T10:00:00.000Z');
    });

    it('jovobe mutato idot a szerver idejere vag', () => {
      const serverNow = at('2026-11-04T12:00:00Z');
      const result = effectiveClientTime(at('2026-11-05T12:00:00Z'), serverNow, serverNow);
      expect(result).toEqual(serverNow);
    });
  });

  describe('incomingWins', () => {
    const stored: StoredRow = {
      version: 10n,
      clientUpdatedAt: at('2026-11-04T12:00:00Z'),
      lastModifiedByDeviceId: 'B',
    };

    it('ha a kliens a legutolso verziora epitett, mindig nyer (regebbi idovel is)', () => {
      expect(
        incomingWins(
          {baseVersion: 10n, effectiveUpdatedAt: at('2026-11-01T00:00:00Z'), deviceId: 'A'},
          stored,
        ),
      ).toBe(true);
    });

    it('konfliktusnal a kesobbi clientUpdatedAt nyer', () => {
      const write = (iso: string) => ({
        baseVersion: 5n,
        effectiveUpdatedAt: at(iso),
        deviceId: 'A',
      });
      expect(incomingWins(write('2026-11-04T12:00:01Z'), stored)).toBe(true);
      expect(incomingWins(write('2026-11-04T11:59:59Z'), stored)).toBe(false);
    });

    it('egyenlo idonel a nagyobb deviceId nyer', () => {
      const same = stored.clientUpdatedAt;
      expect(incomingWins({baseVersion: 5n, effectiveUpdatedAt: same, deviceId: 'A'}, stored)).toBe(
        false,
      );
      expect(incomingWins({baseVersion: 5n, effectiveUpdatedAt: same, deviceId: 'C'}, stored)).toBe(
        true,
      );
    });

    it('baseVersion null (a kliensen uj sor) mar letezo sorra: konfliktus, LWW dont', () => {
      expect(
        incomingWins(
          {baseVersion: null, effectiveUpdatedAt: at('2026-11-04T11:00:00Z'), deviceId: 'A'},
          stored,
        ),
      ).toBe(false);
    });
  });

  describe('syncScopeOf', () => {
    it('a ceg valtozasa uj scope-ot ad', () => {
      const privateScope = syncScopeOf({sub: 'u1', role: UserRole.PRIVATE, companyId: null});
      const companyScope = syncScopeOf({sub: 'u1', role: UserRole.COMPANY_MEMBER, companyId: 'c1'});
      expect(privateScope).not.toBe(companyScope);
    });
  });

  describe('buildPullPage', () => {
    const rows = (...versions: number[]) => versions.map((v) => ({version: BigInt(v)}));

    it('a tablakat version szerint osszefesuli, es a legkisebb limit sort adja', () => {
      const page = buildPullPage([rows(3, 7, 9), rows(4, 5)], 3, 0n, 100n);
      expect(page.rows.map((r) => r.version)).toEqual([3n, 4n, 5n]);
      expect(page.hasMore).toBe(true);
      expect(page.cursor).toBe(5n);
    });

    it('ha nincs tobb sor, a kurzor a felso korlat - 1', () => {
      const page = buildPullPage([rows(3), rows()], 10, 2n, 100n);
      expect(page.hasMore).toBe(false);
      expect(page.cursor).toBe(99n);
    });

    it('ures oldalnal sem lep vissza a kurzor', () => {
      const page = buildPullPage([rows()], 10, 50n, 50n);
      expect(page.cursor).toBe(50n);
    });
  });
});
