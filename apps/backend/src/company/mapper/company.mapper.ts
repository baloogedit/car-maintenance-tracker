import {Company} from '@prisma/client';

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
