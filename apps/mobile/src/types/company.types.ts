import type {UserRole} from './auth.types';

export type CompanyRole = Exclude<UserRole, 'PRIVATE'>;

export interface Company {
  id: string;
  name: string;
  taxId: string | null;
  joinCode: string | null; // csak az admin kapja meg, a tagoknak null
}

export interface CompanyMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: CompanyRole;
}

export interface CreateCompanyRequest {
  name: string;
  taxId?: string;
}
