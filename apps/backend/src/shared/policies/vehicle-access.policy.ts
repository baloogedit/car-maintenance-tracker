import {Prisma, Vehicle} from '@prisma/client';

import {NOT_DELETED} from '../constants/soft-delete.constants';
import {UserRole} from '../enums/user-role.enum';
import {JwtPayload} from '../interfaces/jwt-payload.interface';

// A jogosultsagi szabalyok tiszta fuggvenyekkent: nincs bennuk adatbazis-hivas,
// ezert kulon, gyorsan tesztelhetok (vehicle-access.policy.spec.ts). A szinkron
// is ezeket hasznalja majd.
//
// Lathatosag (olvasas + uj bejegyzes rogzitese):
//   PRIVATE         - csak a sajat jarmuvei
//   COMPANY_ADMIN   - a sajat jarmuvei + a ceg osszes jarmuve
//   COMPANY_MEMBER  - ugyanaz, mint az admin: a ceg osszes jarmuvet latja,
//                     es barmelyikhez rogzithet
// Szerkesztes/torles:
//   jarmu           - a tulajdonos, vagy ceges jarmunel a COMPANY_ADMIN
//   bejegyzes       - a szerzoje (createdByUserId); a jarmu tulajdonosa es
//                     ceges jarmunel a COMPANY_ADMIN barmelyiket; a COMPANY_MEMBER
//                     csak a sajatjat

export type VehicleOwnership = Pick<Vehicle, 'ownerUserId' | 'companyId'>;

export interface AuthoredEntry {
  createdByUserId: string;
}

export function visibleVehiclesWhere(user: JwtPayload): Prisma.VehicleWhereInput {
  const own: Prisma.VehicleWhereInput = {ownerUserId: user.sub};
  if (user.role === UserRole.PRIVATE || !user.companyId) {
    return {...NOT_DELETED, ...own};
  }
  return {...NOT_DELETED, OR: [own, {companyId: user.companyId}]};
}

export function canEditVehicle(user: JwtPayload, vehicle: VehicleOwnership): boolean {
  if (vehicle.ownerUserId === user.sub) return true;
  return isCompanyAdminOf(user, vehicle.companyId);
}

export function canEditEntry(
  user: JwtPayload,
  vehicle: VehicleOwnership,
  entry: AuthoredEntry,
): boolean {
  if (entry.createdByUserId === user.sub) return true;
  if (user.role === UserRole.COMPANY_MEMBER) return false;
  return canEditVehicle(user, vehicle);
}

function isCompanyAdminOf(user: JwtPayload, companyId: string | null): boolean {
  return user.role === UserRole.COMPANY_ADMIN && companyId !== null && user.companyId === companyId;
}
