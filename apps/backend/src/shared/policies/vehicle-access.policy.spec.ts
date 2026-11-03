import {UserRole} from '../enums/user-role.enum';
import {JwtPayload} from '../interfaces/jwt-payload.interface';
import {
  canEditEntry,
  canEditVehicle,
  isNewVehicleForCompany,
  visibleVehiclesWhere,
} from './vehicle-access.policy';

// A jogosultsagi szabalyok egysegtesztje (adatbazis nelkul).
describe('vehicle-access.policy', () => {
  const user = (sub: string, role: UserRole, companyId: string | null = null): JwtPayload => ({
    sub,
    role,
    companyId,
  });
  const privateUser = user('anna', UserRole.PRIVATE);
  const admin = user('fanni', UserRole.COMPANY_ADMIN, 'ceg1');
  const member = user('gabor', UserRole.COMPANY_MEMBER, 'ceg1');
  const otherAdmin = user('judit', UserRole.COMPANY_ADMIN, 'ceg2');

  const companyVehicle = {ownerUserId: 'fanni', companyId: 'ceg1'};
  const memberVehicle = {ownerUserId: 'gabor', companyId: 'ceg1'};
  const privateVehicle = {ownerUserId: 'anna', companyId: null};

  describe('visibleVehiclesWhere', () => {
    it('a maganszemely csak a sajat, nem torolt jarmuveit latja', () => {
      expect(visibleVehiclesWhere(privateUser)).toEqual({deletedAt: null, ownerUserId: 'anna'});
    });

    it('a cegtag a sajat es a ceg osszes jarmuvet latja', () => {
      expect(visibleVehiclesWhere(member)).toEqual({
        deletedAt: null,
        OR: [{ownerUserId: 'gabor'}, {companyId: 'ceg1'}],
      });
    });
  });

  describe('canEditVehicle', () => {
    it('a tulajdonos szerkesztheti', () => {
      expect(canEditVehicle(privateUser, privateVehicle)).toBe(true);
      expect(canEditVehicle(member, memberVehicle)).toBe(true);
    });

    it('a ceg adminja a ceg barmelyik jarmuvet szerkesztheti', () => {
      expect(canEditVehicle(admin, memberVehicle)).toBe(true);
    });

    it('a cegtag mas jarmuvet nem szerkesztheti', () => {
      expect(canEditVehicle(member, companyVehicle)).toBe(false);
    });

    it('masik ceg adminja nem szerkesztheti', () => {
      expect(canEditVehicle(otherAdmin, companyVehicle)).toBe(false);
    });
  });

  describe('canEditEntry', () => {
    it('a cegtag a sajat bejegyzeset szerkesztheti, mas jarmuven is', () => {
      expect(canEditEntry(member, companyVehicle, {createdByUserId: 'gabor'})).toBe(true);
    });

    it('a cegtag mas bejegyzeset nem szerkesztheti, a sajat jarmuven sem', () => {
      expect(canEditEntry(member, memberVehicle, {createdByUserId: 'fanni'})).toBe(false);
    });

    it('az admin a ceg barmelyik bejegyzeset szerkesztheti', () => {
      expect(canEditEntry(admin, memberVehicle, {createdByUserId: 'gabor'})).toBe(true);
    });

    it('a maganszemely a sajat jarmuve bejegyzeseit szerkesztheti', () => {
      expect(canEditEntry(privateUser, privateVehicle, {createdByUserId: 'anna'})).toBe(true);
    });
  });
  describe('isNewVehicleForCompany', () => {
    it('ceges felhasznalonal alapbol ceges jarmu (admin es tag is)', () => {
      expect(isNewVehicleForCompany(admin)).toBe(true);
      expect(isNewVehicleForCompany(member)).toBe(true);
    });

    it('ceges felhasznalo kerhet maganjarmuvet', () => {
      expect(isNewVehicleForCompany(member, false)).toBe(false);
    });

    it('maganszemely jarmuve mindig maganjarmu', () => {
      expect(isNewVehicleForCompany(privateUser, true)).toBe(false);
    });
  });
});
