import {ApiProperty} from '@nestjs/swagger';
import {IsIn} from 'class-validator';

import {UserRole} from '../../../shared/enums/user-role.enum';

// Cegen belul csak a ket ceges szerepkor kozott lehet valtani.
export const COMPANY_ROLES = [UserRole.COMPANY_ADMIN, UserRole.COMPANY_MEMBER] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

export class ChangeMemberRoleDto {
  @ApiProperty({enum: COMPANY_ROLES, example: UserRole.COMPANY_ADMIN})
  @IsIn(COMPANY_ROLES)
  role: CompanyRole;
}
