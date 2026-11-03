import {Company, User} from '@prisma/client';

import {CompanyMemberResponseDto} from '../dto/output/company-member-response.dto';
import {CompanyResponseDto} from '../dto/output/company-response.dto';

// Prisma Company -> valasz. A csatlakozasi kodot csak az admin kapja meg,
// mert aki ismeri, belephet a cegbe.
export function toCompanyResponse(company: Company, includeJoinCode: boolean): CompanyResponseDto {
  return {
    id: company.id,
    name: company.name,
    taxId: company.taxId,
    joinCode: includeJoinCode ? company.joinCode : null,
  };
}
// Prisma User -> a taglista egy sora (a jelszo hash es a belso mezok nelkul).
export function toCompanyMemberResponse(user: User): CompanyMemberResponseDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}
