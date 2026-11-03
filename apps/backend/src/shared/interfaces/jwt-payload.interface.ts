import {UserRole} from '../enums/user-role.enum';

// Az access token payload-ja: {sub, role, companyId}. A JwtGuard a tokenbol
// csak a felhasznalo azonositojat (sub) hasznalja, a szerepkort es a ceget
// minden keresnel az adatbazisbol tolti be, es ezt teszi a request.user-re
// (a @CurrentUser() decorator innen olvassa).
export interface JwtPayload {
  sub: string;
  role: UserRole;
  companyId: string | null;
}
