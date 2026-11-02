import {applyDecorators, SetMetadata, UseGuards} from '@nestjs/common';

import {ROLES_KEY} from '../constants/roles.constants';
import {UserRole} from '../enums/user-role.enum';
import {RolesGuard} from '../guards/roles.guard';

// @Roles(UserRole.COMPANY_ADMIN): csak a felsorolt szerepkorok erhetik el az
// utvonalat. A jelolest es a RolesGuard bekapcsolasat egyutt vegzi, igy eleg
// egy dekoratort irni.
export const Roles = (...roles: UserRole[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(RolesGuard));
