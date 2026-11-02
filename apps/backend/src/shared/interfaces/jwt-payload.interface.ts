import {UserRole} from '../enums/user-role.enum';

// Az access token payload-ja: {sub, role, companyId}. A JwtGuard ezt teszi
// a request.user-re, a @CurrentUser() decorator innen olvassa.
export interface JwtPayload {
  sub: string;
  role: UserRole;
  companyId: string | null;
}
